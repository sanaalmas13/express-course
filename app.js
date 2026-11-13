const express = require("express");
const joi = require("joi");
const mongoose = require("mongoose");
require("dotenv").config();



const dns = require("node:dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const Student = require("./models/Student");


const app = express();
app.use(express.json());


function logger(req, res, next){
    console.log("Method:", req.method);

    console.log("URL:", req.url);

    next();
}
app.use(logger);

function Middleware(req, res, next){
    console.log("middleware executed")

    next();
}

app.use(Middleware);

function  secondMiddleware(req, res, next){
    console.log("second middleware executed")

    next();
}

app.use(secondMiddleware);

function checkRequest(req, res, next){
    console.log("Request checked");

    next();
}

function checkAuth(req, res, next){

    const isLoggedIn = false;

    if(!isLoggedIn){
        return res.status(401).json({
            message : "Unauthorized access"
        });
    }

    next();
}
   
function errorHandler(err, req, res, next){
    res.status(err.statusCode || 500).json({
        message: err.message
    })
}

app.use(errorHandler);

const studentSchema = joi.object({
   

    name: joi.string().min(2).required(),

    age: joi.number().integer().positive().required(),

    course: joi.string().min(2).required(),

    email: joi.string().email().required()

});

const patchStudentSchema = joi.object({
    name: joi.string().min(2),
    age: joi.number().integer().positive(),
    course: joi.string().min(2),
    email: joi.string().email()
}).min(1);

app.post("/students", async(req,res) => {
    try{
        const newStudent = new Student(req.body);

        const savedStudent = await newStudent.save();

        res.status(201).json({
            message : "student saved successfully",
            student : savedStudent
        });
    } catch (error){
        res.status(400).json({
            message : error.message
        });
    }
})

app.get("/students/:id", checkAuth, async(req,res) => {
   
    try{
        const id = req.params.id;

        const student = await Student.findById(id);

        if(!student ){
            return res.status(404).json({
                message: "student not found"
            })
        }

        res.status(200).json({
            message : "student fetched successfully",
            student : student
        });
    } catch (error){
        res.status(400).json({
            message : error.message
        });
    }
})

app.put("/students/:id", async(req,res) => {
    try{
      const {error} =  studentSchema.validate(req.body); 

      if(error){
        return res.status(400).json({
            message : error.details[0].message
        });
      }
      const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new: true, runValidators: true}
    );

    if(!updatedStudent){
        return  res.status(404).json({
                message: "Student not found"
            });
    }

    res.status(200).json({
            message: "Student updated successfully",
            student: updatedStudent
        });
}   catch (error){
    res.status(400).json({
        message : error.message
    })
}
})

app.put("/students/:id", async(req, res) => {
    try{
        const {error} = studentSchema.validate(req.body);
        if(error){
            return res.status(400).json({
                message: error.details[0].message
            });
        }
       const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new: true, runValidators: true}
       );

        if (!updatedStudent) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json({
            message: "Student updated successfully",
            student: updatedStudent
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
})

app.patch("/students/:id", async (req, res) => {
    try {
        const { error } = patchStudentSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedStudent) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json({
            message: "Student updated successfully",
            student: updatedStudent
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDb connected sucessfully");
})
.catch((error) => {
    console.log("MongoDB Error:", error.message);

    if (error.reason?.servers) {
        for (const [address, server] of error.reason.servers) {
            console.log("Server:", address);
            console.log("Server Error:", server.error?.message);
        }
    }
});

app.delete("/students/:id", async (req, res) => {
    try {
        const deletedStudent = await Student.findByIdAndDelete(
            req.params.id
        );

        if (!deletedStudent) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json({
            message: "Student deleted successfully",
            student: deletedStudent
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

app.get("/test-error",(req, res, next) => {
    const err = new Error("something wnt wrong");
    next(err);
})

app.get("/test-async-error", async(req, res, next) => {
    try{
        throw new Error("Async operation failed");
    } catch (error){
        next(error);
    }
});

app.use((req, res, next) => {
    const err = new Error("route not found");
    err.statusCode = 404;
    next(err);
})

app.use(errorHandler);
app.listen(3000, () =>{
    console.log("server running on port")
})