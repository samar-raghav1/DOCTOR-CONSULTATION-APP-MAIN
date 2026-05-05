const express = require("express");
const validate = require("../middleware/validate");
const { body } = require("express-validator");
const jwt = require("jsonwebtoken");
const Admin = require("../modal/Admin");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const {
  authenticate,
  requireRole,
  requireAdmin,
  requirePermission,
} = require("../middleware/auth");
const Patient = require("../modal/Patient");
const Doctor = require("../modal/Doctor");
const Appointment = require("../modal/Appointment");

const router = express.Router();

const signToken = (id, type) =>
  jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post(
  "/auth/login",
  [body("email").isEmail(), body("password").isLength({ min: 6 })],
  validate,
  async (req, res) => {
    try {
      const admin = await Admin.findOne({ email: req.body.email });
      if (!admin || !admin.isActive) {
        return res.unauthorized("Invalid credentials or account deactivated");
      }
      const validatePassword = await bcrypt.compare(
        req.body.password,
        admin.password,
      );
      if (!validatePassword) {
        return res.unauthorized("Invalid credentials");
      }
      admin.lastlogin = new Date();
      await admin.save();
      const token = signToken(admin._id, "admin");
      res.ok(
        {
          token,
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
            type: "admin",
          },
        },
        "Admin Login successful",
      );
    } catch (error) {
      res.serverError("Login failed", [error.message]);
    }
  },
);

// get admin profile

router.get("/profile", authenticate, requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select("-password");
    console.log(admin);
    res.ok(admin, "Admin profile fetched");
  } catch (error) {
    console.error("Admin profile fetch failed", error);
    res.serverError("Admin profile fetch failed", [error.message]);
  }
});



//
router.get("/dashboard", authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      totalRevenue,
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "completed" }),
      Appointment.countDocuments({ status: "Scheduled" }),
      Appointment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const monthlyRevenue = await Appointment.aggregate([
      { $match: { status: "Completed", createdAt: { $gte: sixMonthAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$fees" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);


    const [userGrowth, appointmentStats] = await Promise.all([
      Appointment.aggregate([
        { $match: { createdAt: { $gte: sixMonthAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            patients: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Appointment.aggregate([
        {
          $match: { createdAt: { $gte: sixMonthAgo } },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.ok(
      {
        stats: {
          totalPatients,
          totalDoctors,
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
        },
        monthlyRevenue,
        userGrowth,
        appointmentStats,
      },
      "Admin dashboard data fetched",
    );
  } catch (error) {
    console.error("Admin dashboard fetch failed", error);
    res.serverError("Admin dashboard fetch failed", [error.message]);
  }
});


// get all users


router.get("/users" , authenticate , requireAdmin , requirePermission("userManagement"), async(req,res)=>{
    try{
       const { page = 1, limit = 10, type, search = "" } = req.query;
        const skip= (page -1) * limit;

        let query = {};
        if(type){
            query = {...query , type};
        }

        if(search){
            query = {...query , $or :[
                {name: {$regex : search , $options :"i"}},
                {email:{$regex: search , $options:"i"}}
            ]}
        }

        const [patients, doctors]= await Promise.all([
            Patient.find(query).select("-password").skip(skip).limit(parseInt(limit)),
            Doctor.find(query).select("-password").skip(skip).limit(parseInt(limit)),
        ])

       const users = [
  ...patients.map(p => ({...p.toObject(), type:"patient"})),
  ...doctors.map(d => ({...d.toObject(), type:"doctor"}))
];

        res.ok(users, "Users retrived")

    }catch(error){
            console.error("Fetch users failed", error);
                res.serverError("Fetch users failed", [error.message])
    }
})




// update status

router.put("/users/:userId/status" , authenticate , requireAdmin , requirePermission("userManagement"), async (req,res)=>{
    try{
        const {userId}= req.params;
        const {isActive} = req.body;



        // first check which collection the user belong
         const patient = await Patient.findById(userId);
         const doctor  = await Doctor.findById(userId);

         let updatedUser;
         if(patient){
            updatedUser = await Patient.findByIdAndUpdate(userId, {isActive}, {new:true}).select("-password");
         }else if(doctor){
             udatedUser = await Doctor.findByIdAndUpdate(userId, {isActive}, {new:true}).select("-password");
         }else{
            return res.notFound("user not found")
         }
         res.ok(udatedUser ,"User status updated")

    }catch(error){
            console.error("Fetch users failed", error);
                res.serverError("Fetch users failed", [error.message])
    }
})



// payment and other routes can be added here with similar pattern

router.get("/payments" , authenticate , requireAdmin , requirePermission("paymentManagement"), async(req,res)=>{
  try{
    const { page = 1, limit = 10, search = "", payoutStatus } = req.query;
    const skip= (page -1) * limit;
    let matchQuery = {sttus:"Completed"};
    if(payoutStatus){
      matchQuery.payoutStatus = payoutStatus;
    }

    const appointments = await Appointment.aggregate([
      {
        $match: matchQuery
      },
      {
      $lookup:{
        from:"patients",
        localField:"patientId",
        foreignField:"_id",
        as:"patient"
      },
    },
    {
      $unwind:"$patient"
    },
    {
      $project:{
        _id:1,
        date:1,
        doctorName:"$doctor.name",
        doctorEmail:"$doctor.email",
        patientName:"$patient.name",
        patientEmail:"$patient.email",
       consultationFees:1,
       payoutStatus:1,
       totalAmount:1,
       payoutDate:1,
       paymentStatus:1,
       created:1,
       platformFees:1
      }
    },
    {
      $sort:{created:-1}
    },{
      $skip: skip
    },
    {
      $limit: parseInt(limit)
    }
    ]);

    res.ok(appointments, "Payments fetched")
  }
  catch(error){
    console.error("Fetch payments failed", error);
    res.serverError("Fetch payments failed", [error.message])
  }
}
)


// 
router.post("/payments/:appointmentId/payout", authenticate, requireAdmin, requirePermission("paymentManagement"),async (req, res) => {
  try {
    const {appointmentId}  = req.params;
    const {payoutDate} = req.body;

    const appointment = await Appointment.findById(appointmentid);
    if(!appointmentt){
      return res.notFound("Appointment not found");
    }

    if(appointment.payoutStatus === "Completed"){
      return res.badRequest("Payout already completed for this appointment");
    }

    const payoutAmount = appointment.consultationFees;
    const platformFees = appointment.platformFees;


    const updateData = {
      payoutStatus};

      if(payoutStatus === "Paid"){
        updateData.payoutDate = new Date();
      }

      const updatedAppointment = await Appointment.findByIdAndUpdate(appointmentId, updateData, {new:true}).populate("doctorId", "name email").populate("patientId", "name email");

      res.ok({
        ...updatedAppointment.toObject(),
        payoutAmount,
        platformFees,
        message: payoutStatus === "Paid" ? `payout marked as paid .Doctor receives ${payoutAmount}` 
        : `Payout ${payoutStatus.toLowerCase()} successfully`
      }, `Payout ${payoutStatus.toLowerCase()} successfully`);
      
  }



catch(error){
    console.error("Update payout status failed", error);
    res.serverError("Update payout status failed", [error.message])
}
})





module.exports = router;
