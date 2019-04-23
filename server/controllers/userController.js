const userService = require('../services/userService');
const imageNo = require('../models/imageno');
const appno = require('../models/appno');
const userModel = require('../models/userModel');
const fs = require('fs');

let userController = {};


userController.register = async (request, h) => {
    console.log("usercontroller reached");
    let payload = request.payload;

    // TO CHECK IF ATLEAST ONE USER IS PRESENT IN DB
   
    // TO CHECK IF EMAIL IS NOT ALREADY USED 
    let email = await userService.checkEmail(payload.email);
    console.log("emailchecked");
    if (email) {
        console.log("email already in use");
        return { statusCode: 409, message: "email already registered" };
    }
    console.log("email not in use");

    // TO CHECK IF APP NO. IS PRESENT IN APP COLLECTION
    let firstAppNO = await appno.findOne({});
    if (!firstAppNO) {
        await userService.enterFirstAppNo(100000);
        console.log("first app no. is entered")
    }
    console.log("app no. is exist");

    //  FUNCTION TO SAVE IMAGE AND SIGN INTO UPLOADS FOLDER

    console.log('uploadfile function reached');
    // console.log(payload);
   let imgName = payload.image.hapi.filename;
   let sgnName = payload.sign.hapi.filename;
    console.log(imgName + " " + sgnName);
    // if (payload.image && payload.sign) {
    // console.log("if reached");
    let lastImageNo = await imageNo.findOne({});
    console.log(lastImageNo);
    if (!lastImageNo) {
        console.log(" imageno does not exist so entering first imageno ...")
        lastImageNo = await userService.enterFirstImageNo(1);
        console.log("first imageno. entered");
    }
    let newImageNo = lastImageNo.imageNo + 1;
    console.log(newImageNo);
    await imageNo.findOneAndUpdate({ imageNo: lastImageNo.imageNo }, { imageNo: newImageNo });
    let imageName = newImageNo + imgName.substr(imgName.lastIndexOf('.'));
    let signName = newImageNo + sgnName.substr(sgnName.lastIndexOf('.'));
    console.log("name of the file " + "" + imageName + "" + signName);
    let imagePath = __dirname + "/imageUploads/" + imageName;
    let signPath = __dirname + "/signUploads/" + signName;
    console.log(imagePath + signName);
  let imageFile = fs.createWriteStream(imagePath);
    let signFile = fs.createWriteStream(signPath);

    imageFile.on('error', (err) => console.error(err));
    signFile.on('error', (err) => console.error(err));
    payload.image.pipe(imageFile);
    payload.sign.pipe(signFile);

    imageFile.on('end', (err) => {
        let ret = {
            filename: payload.image.hapi.filename,
            headers: payload.image.hapi.headers
        }
        return JSON.stringify(ret);

    }
    );
    signFile.on('end', (err) => {
        const ret = {
            filename: payload.sign.hapi.filename,
            headers: payload.sign.hapi.headers
        }
        return JSON.stringify(ret);

    }
    )






    // DATA SEND TO BE SAVED INTO DATABASE
    let response = await userService.saveData(payload, firstAppNO, imagePath, signPath);
    return response;

}
module.exports = userController;
