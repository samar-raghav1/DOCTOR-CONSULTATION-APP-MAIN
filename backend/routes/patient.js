
const express = require("express");
const router = express.Router();

require("dotenv").config();

const Patient = require("../modal/Patient");
const { authenticate, requireRole } = require("../middleware/auth");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { computeAgeFromDob } = require("../utils/date");

const client = require("../config/twilio");

// ======================
// 🔹 GET PROFILE
// ======================
router.get(
  "/me",
  authenticate,
  requireRole("patient"),
  async (req, res) => {
    const doc = await Patient.findById(req.user._id).select(
      "-password -googleId"
    );
    res.ok(doc, "Profile fetched");
  }
);

// ======================
// 🔹 SEND OTP
// ======================
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
 if (!phone.startsWith("+91")) {
    phone = "+91" + phone;
  }

  try {
    console.log("Phone:", phone);

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    res.ok(null, "OTP sent");
  } catch (error) {
    console.error("Twilio Error:", error); // 👈 VERY IMPORTANT
    res.serverError("OTP send failed", [error.message]);
  }
});

// ======================
// 🔹 VERIFY OTP
// ======================
router.post("/verify-otp", authenticate, async (req, res) => {
  const { phone, code } = req.body;

 if (!phone.startsWith("+91")) {
    phone = "+91" + phone;
  }

  try {
    if (!phone || !code) {
      return res.badRequest("Phone and OTP required");
    }

    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phone,
        code,
      });

    if (result.status === "approved") {
      await Patient.findByIdAndUpdate(req.user._id, {
        phone,
        isPhoneVerified: true,
      });

      return res.ok(null, "Phone verified successfully");
    } else {
      return res.badRequest("Invalid OTP");
    }
  } catch (error) {
    res.serverError("OTP verification failed", [error.message]);
  }
});

// ======================
// 🔹 UPDATE PROFILE
// ======================
router.put(
  "/onboarding/update",
  authenticate,
  requireRole("patient"),
  [
    body("name").optional().notEmpty(),
    body("phone").optional().isString(),
    body("dob").optional().isISO8601(),
    body("gender").optional().isIn(["male", "female", "other"]),
    body("bloodGroup").optional().isString(),

    body("emergencyContact").optional().isObject(),
    body("emergencyContact.name").optional().notEmpty(),
    body("emergencyContact.phone").optional().notEmpty(),
    body("emergencyContact.relationship").optional().notEmpty(),

    body("medicalHistory").optional().isObject(),
    body("medicalHistory.allergies").optional().notEmpty(),
    body("medicalHistory.currentMedications").optional().notEmpty(),
    body("medicalHistory.chronicConditions").optional().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      // 🔒 Must verify phone first
      if (!req.user.isPhoneVerified) {
        return res.badRequest("Please verify phone first");
      }

      const updated = { ...req.body };

      if (updated.dob) {
        updated.age = computeAgeFromDob(updated.dob);
      }

      delete updated.password;

      updated.isProfileComplete = true;

      const doc = await Patient.findByIdAndUpdate(
        req.user._id,
        updated,
        { new: true }
      ).select("-password -googleId");

      res.ok(doc, "Profile updated successfully");
    } catch (error) {
      res.serverError("Update failed", [error.message]);
    }
  }
);

module.exports = router;