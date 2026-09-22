const express = require("express");
const router = express.Router();
const authcontroller = require('../controllers/authcontrollers')
const upload = require("../middewares/upload");
const verifytoken = require('../middewares/jwtverify')
const { AuthMiddleware } = require('../middewares/authMiddleware');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const {adminPermission} = require('../middewares/adminpermission');

router.get('/getsignupuidata', authcontroller.getSignupData)                //sinup get//
router.post('/postsignup', authcontroller.signup)                           //sinup post   // 
router.post('/postotp', authcontroller.verifyOtp)                           //verify otp //   
router.post('/postlogin', authcontroller.login)                             //login//     
router.get('/getloginuidata', authcontroller.getLoginData)                  //get login  //     
router.put("/putprofileinfo",adminPermission, verifytoken, upload.singleWithSizeError("avatar"), upload.validateDimensions, authcontroller.updateProfile);// // update profile
router.get("/getuserdata", verifytoken, authcontroller.getProfile);         //get profile//   
router.post("/postchangepassword",adminPermission,verifytoken,authcontroller.changePassword)//change Password//      
router.post('/postforgetpassword', authcontroller.sendresetlink);           //send OTP to email //   
router.post('/postsetnewpassword', authcontroller.resetPassword);           //reset password   // 
router.get('/getblog', authcontroller.getBlogs);                            //get blogs //
router.get('/getblogdetails/:id', authcontroller.getBlogDetails);           //get Blog details //
router.get("/getherodata", authcontroller.getHeroSection);                  //hero section//
router.get("/gettaglinedata", authcontroller.getTaglinedata);               //get brands//
router.get('/getportfoliodata',authcontroller.getPortfolioData)             //get Portfolio Data//
router.get('/getfeaturedata',authcontroller.getFeatureData)                 //get Feature Data//
router.get("/getfaqdata", authcontroller.getFaq);                           //get faqs// 
router.get("/getreviews", authcontroller.getReview);                        //get reviews//    
router.get("/getgeneraldata", authcontroller.getGeneralData);               //get contact us //  
router.get("/getpricingdata", authcontroller.getPricingPlans);              //get pricing plans monthly and annual//   
router.post("/postcontactus", authcontroller.contactUs);                    //post conatct us  //   
router.get("/websitetype", authcontroller.getBusinessTypeData);             //get Business Type Data//
router.get("/getcategorydata", authcontroller.getCategoryData);             //get Business Type Data//   
router.get("/getctadata", authcontroller.getCtaData);                       //get category// 
router.get("/countries", authcontroller.getCountries);                      //get Country
router.get("/states/:countryId", authcontroller.getStatesByCountry);        //get  State by country
router.post("/postsupportticket", adminPermission, verifytoken, upload.arrayWithSizeError("attachments"), authcontroller.createTicket);            //crate ticket//
router.post("/postticketreply/:id",adminPermission, verifytoken, upload.arrayWithSizeError("attachments"), authcontroller.replyToTicket);         // replay ticket by user//    
router.post("/admin/ticketreply/:id",adminPermission, AuthMiddleware, upload.arrayWithSizeError("attachments"), authcontroller.replyToTicket);    //rreplay ticket by admin//
router.get("/getsupportticket", verifytoken, authcontroller.getUserTickets);               //get User Tickets//     
router.get("/getticketresponse/:ticketId", verifytoken, authcontroller.getSingleTicket);   //get Single Ticket
router.get('/userpaymentlog', verifytoken, authcontroller.getUserPayments);                 //get User Payments// 
router.get('/getuserdashboard',verifytoken, authcontroller.getDashboardData);                          //get user dashboard data//
router.post('/postnewsletter', authcontroller.subscribeNewsletter);                        //subscribe newsletter//
router.post('/checkout',adminPermission, verifytoken, authcontroller.createPayment);                       //stripe checkout
router.post('/verifypayment', adminPermission, verifytoken, authcontroller.verifyPayment);                   // Verify payment
router.post("/braintreecapture",adminPermission, authcontroller.captureBraintree);                         //barintree
router.get("/braintreetoken",adminPermission, authcontroller.getBraintreeToken);                         //barintree
router.post('/resendcode', authcontroller.resendcode);                                     // resendcode //  
router.get('/gethowitworkdata', authcontroller.getHowItWorkData);                          //grow working //  
router.get('/paymentgateways', authcontroller.getAllGateways);                             // payment get way checkout page 
router.post('/preferance/:categoryId',adminPermission, verifytoken,authcontroller.createPreferenceWithAI);  // create preferance 
router.put('/preference/:preferenceId',adminPermission, verifytoken, authcontroller.updatePreferenceResponse);  // update  preferance
router.post("/preferenceattach/:preferenceId",adminPermission, verifytoken, upload.fieldsWithSizeError([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
  ]), authcontroller.updatePreferenceAttach);            //update preferance attach//
router.post("/preferenceregenerate/:preferenceId",adminPermission, verifytoken, authcontroller.regeneratePreferenceWithAI);            //update preferance attach//
router.post("/duplicatewebsite",adminPermission, verifytoken, authcontroller.dupalicatWebsite);            //update preferance attach//

router.post("/publish",adminPermission,verifytoken, authcontroller.publishPreference);  //publish
router.delete("/deleteaccount",adminPermission,verifytoken,authcontroller.deleteAccount); //delete account
router.get("/getuserwebhistory",verifytoken,authcontroller.getUserWebHistory);  // get user history
router.get("/getuserwebhistory/:preferenceId",verifytoken,authcontroller.getUserWebHistorySingledata);  // get user history single data
router.get("/deletewebhistory/:preferenceId",verifytoken,authcontroller.deleteWebHistory);  // get user history single data
router.get("/Seo",authcontroller.getAllSeo);// get all seo data for website
router.get('/getpagedetails/:pageName',authcontroller.getPage);// get page details for seo
router.put("/updatenotifications",adminPermission, verifytoken,authcontroller.updateNotificationSettings);// update notification settings
router.get('/websiteanalytic',verifytoken,authcontroller.websiteAnalytic);// website analytic data
router.get('/getpages',verifytoken,authcontroller.getPageLibrary);// website analytic data
// Languages
router.get("/getlanguage",authcontroller.getLanguage);
// Translation languages
router.get("/gettranslationlanguages",authcontroller.getTranslationLanguages);
// Translation keys
router.get("/gettranslations/:lang",authcontroller.getTranslations);

// Assign free plan
router.post(
  "/assignfreeplan",
  adminPermission,
  verifytoken,
  authcontroller.assignFreePlan
);

// ================= GOOGLE AUTH ================= //

// Step 1: Redirect to Google
router.get('/auth/google', authcontroller.googleAuth);

// Step 2: Google Callback
router.get('/auth/google/callback', authcontroller.googleAuthCallback);


// ================ Githbub AUTH =============//
 
// Step 1: Redirect to GitHub
router.get('/auth/github', authcontroller.githubAuth);
 
// Step 2: GitHub Callback
router.get('/auth/github/callback', authcontroller.githubAuthCallback);

module.exports = router;