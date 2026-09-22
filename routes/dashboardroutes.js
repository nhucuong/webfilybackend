const express = require("express");
const router = express.Router();
const dashboardroutes = require("../controllers/dashboardcontrollers");
const upload = require("../middewares/upload");
const { AuthMiddleware } = require('../middewares/authMiddleware');
const {adminPermission} = require('../middewares/adminpermission');

router.use(adminPermission);

//login page section
router.get("/loginpage", dashboardroutes.loginpage);//get login-page
router.post("/login", dashboardroutes.login);// login

//forgrtpassword
router.get('/forget-password', dashboardroutes.getForgetPassword);                          // get forgetpassword
router.post('/forget-password', dashboardroutes.postForgetPassword);                        //post forgetpassword
router.get('/reset-password/:token', dashboardroutes.getResetPassword);                     // get reset-password
router.post('/reset-password', dashboardroutes.postResetPassword);


// APPLY GLOBAL SECURITY ----------------------
router.use(AuthMiddleware);

router.get('/', dashboardroutes.dashboard)
router.get("/logout", dashboardroutes.logout);//logout

//manage users
router.get('/activeusers', dashboardroutes.Activeusers)
router.get('/bannedusers', dashboardroutes.Bannedusers)
router.get('/allusers', dashboardroutes.Allusers)

//payment getway
router.get('/pendingpayment', dashboardroutes.Pendingpayment)
router.get('/successfulpayment', dashboardroutes.Successfulpayment)
router.get('/rejectedpayment', dashboardroutes.Rejectedpayment)
router.get('/allpayment', dashboardroutes.AllPayment)


// Support Ticket
router.get('/pendingtickets', dashboardroutes.Pendingtickets)
router.get('/closedtickets', dashboardroutes.Closedtickets)
router.get('/answeredtickets', dashboardroutes.Answeredtickets)
router.get('/alltickets', dashboardroutes.Alltickets)
router.get('/ticketdetails/:id', dashboardroutes.ticketdetails)


// report
router.get('/subscriptionhistory', dashboardroutes.Subscriptionhistory);
router.get('/loginhistory', dashboardroutes.Loginhistory);
router.get('/notificationhistory', dashboardroutes.Notificationhistory);
router.get('/latestnotification', dashboardroutes.getnotification);
router.get('/readnotification/:id', dashboardroutes.notificationread)

// Frontend Managment

//Manage Tag
router.get("/addtag", dashboardroutes.addTag);
router.post("/tagsave", dashboardroutes.saveTag);
router.get("/taggetjson", dashboardroutes.getTagJson);
router.delete("/deletetag/:id", dashboardroutes.deleteTag);

//Manage Subscription Plan
router.get('/subscriptionplan', dashboardroutes.getSubscriptionPlan)
router.get('/addsubscriptionplan/:id', dashboardroutes.AddSubscriptionPlan)
router.get('/addsubscriptionplan', dashboardroutes.AddSubscriptionPlanPage)
router.post('/subscriptionsave', dashboardroutes.saveSubscriptionPlan)
router.get('/subscriptionplanjson', dashboardroutes.getSubscriptionJSON)
router.patch('/subscriptionplans/toggle/:id', dashboardroutes.togglesubscription)
router.delete('/subscriptionplans/delete/:id', dashboardroutes.deletesubscription)

//Manage Faq
router.get('/faq', dashboardroutes.getfaqpage)
router.get('/faqjson', dashboardroutes.getFAQJson)
router.post('/faqsave', dashboardroutes.saveFAQ)
router.delete('/faqdelete/:id', dashboardroutes.deleteFAQ)


//Manage Testimonials
router.get('/testimonials', dashboardroutes.getTestimonialPage)
router.get('/testimonialsjson', dashboardroutes.getTestimonialsJson)
router.post('/testimonialssave', upload.singleWithSizeError('image'), upload.validateDimensions, dashboardroutes.saveTestimonial)
router.delete('/testimonialsdelete/:id', dashboardroutes.deleteTestimonial)


//Manage Blog
router.get("/blogs", dashboardroutes.getblogpage);
router.get("/blogjson", dashboardroutes.getblogjson);   
router.post("/blogsave", upload.singleWithSizeError("image"), upload.validateDimensions, upload.generateThumbnail, dashboardroutes.saveblog);
router.delete("/blogdelete/:id", dashboardroutes.deleteblog);


//Mange setting US
router.get("/setting", dashboardroutes.getsettingpage);
router.post("/saveSetting", upload.fieldsWithSizeError([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 }
  ]), upload.validateDimensions, dashboardroutes.saveSetting);
router.get("/getSettingjson", dashboardroutes.getSettingjson);


//Manage Categories
router.get('/category', dashboardroutes.getBusinessType);
router.get("/getcategoryjson", dashboardroutes.getBusinessTypeJSON);
router.post("/savecategory", dashboardroutes.saveBusinessType);
router.delete("/categorydelete/:id", dashboardroutes.deleteBusinessType);
router.post("/categorystatus/:id", dashboardroutes.toggleBusinessTypeStatus);


// Manage Countries
router.get('/countries', dashboardroutes.getcountries)
router.get("/getcountriesjson", dashboardroutes.getCountriesJSON);
router.post("/savecountry", dashboardroutes.saveCountry);
router.delete("/countrydelete/:id", dashboardroutes.deleteCountry);
router.post("/countrystatus/:id", dashboardroutes.CounteytoggleStatus);
router.get("/getcountries", dashboardroutes.getCountries);


//Manage States
router.get('/state', dashboardroutes.getstate)
router.get("/getstatesjson", dashboardroutes.getStatesJson);
router.post("/savestate", dashboardroutes.saveState);
router.delete("/statedelete/:id", dashboardroutes.deleteState);
router.post("/statestatus/:id", dashboardroutes.togglestatesStatus);


//Manage User
router.get("/getactiveusersjson", dashboardroutes.getactiveUsersJson);
router.post("/userstatus/:id", dashboardroutes.toggleuserStatus);
router.post("/emailverify/:id", dashboardroutes.toggleEmailVerification);
router.get("/getbannedusersjson", dashboardroutes.getbannedUsersJson);
router.get("/getverified",dashboardroutes.getverifieduser)
router.get("/getnotverifiedusersjson", dashboardroutes.getnotverifiedUsersJson);
router.get("/getuserjson", dashboardroutes.getUsersJson);
router.get('/userdetails/:id', dashboardroutes.getUserDetails)


// Send Notifiction 
router.get('/sendnotification', dashboardroutes.Sendnotification)
router.get('/fetch-users-email', dashboardroutes.fetchusersemail)
router.post("/send-email", dashboardroutes.sendEmail);


//Manage Payment
router.get("/allpaymentlist", dashboardroutes.getPaymentslist);
router.get("/pandingpaymentlist", dashboardroutes.getpandingPayments);
router.get("/rejectpaymentlist", dashboardroutes.getrejectPayments);
router.get("/successpaymentlist", dashboardroutes.getsuccessPayments);
router.get('/paymentdetails/:id', dashboardroutes.Paymendetails)
router.get('/allpaymentdetails/:id', dashboardroutes.Allpaymentdetails)


//Manage Support Ticket
router.get('/opensupportticketjson', dashboardroutes.getOpenSupportTickets);
router.get('/answeredsupportticketjson', dashboardroutes.getAnsweredSupportTickets);
router.get('/closedsupportticketjson', dashboardroutes.getClosedSupportTickets);
router.get('/allsupportticketjson', dashboardroutes.getSupportTicketsjson);
router.post("/ticket/update-status/:id", dashboardroutes.updateTicketStatus);//close ticket
router.delete("/ticket/message/delete/:ticketId/:messageId", dashboardroutes.deleteTicketMessage);//ticket message delete

//Report
router.get('/subscriptionhistoryjson', dashboardroutes.getSubscriptionHistory)
router.get('/loginhistoryjson', dashboardroutes.getLoginHistoryJSON);
router.get("/loginhistoryjson/:id", dashboardroutes.getSingleUserLoginHistoryJSON);
router.get("/loginhistory/:id", dashboardroutes.SingleUserLoginHistoryPage);

router.get('/notificationhistoryjson', dashboardroutes.getNotificationJSON)


//contact US
router.get('/inquiry', dashboardroutes.getInquiry);
router.get('/inquiryjson', dashboardroutes.getinquiryjson);
router.delete("/inquirydelete/:id", dashboardroutes.deleteInquiryJSON);


//newsletter
router.get('/newsletter', dashboardroutes.newsletterpage);
router.get('/newsletterjson', dashboardroutes.getNewsletterJson);

//profile page
router.get('/profile', dashboardroutes.getprofile);
router.post('/changepassword', dashboardroutes.changePassword);
router.put("/adminimage", upload.singleWithSizeError("image"), dashboardroutes.updateProfileImage);



// Hero Section
router.get('/herosection', dashboardroutes.getherosectionpage);
router.get('/herosectionjson', dashboardroutes.getherosectionjson);
router.post('/herosectionsave',upload.none(),dashboardroutes.saveherosection);

// Hero Stat
router.get("/herostats", dashboardroutes.getHeroStats);
router.get("/herostatsjson", dashboardroutes.getHeroStatsJson);
router.post("/herostatssave", dashboardroutes.saveHeroStats);
router.delete("/herostatsdelete/:id", dashboardroutes.deleteHeroStats);


// howitwork
router.get("/howitwork", dashboardroutes.getHowItWork);
router.get("/howitworkjson", dashboardroutes.getHowItWorkJson);
router.post("/howitworksave", upload.singleWithSizeError("image"),upload.validateDimensions,dashboardroutes.saveHowItWork);
router.delete("/howitworkdelete/:id", dashboardroutes.deleteHowItWork);

//growingtool section
router.get('/Features', dashboardroutes.getFeatures);
router.get('/Featuresjson', dashboardroutes.getFeaturesJson);
router.post('/Featuressave', dashboardroutes.saveFeatures);
router.delete('/Featuresdelete/:id', dashboardroutes.deleteFeatures);

// login section
router.get('/loginsection', dashboardroutes.getLoginSection);

//payment getway (checkout)
router.get("/paymentgateway", dashboardroutes.getPaymentPage);
router.get("/paymentgatewayjson", dashboardroutes.getPaymentJson);
router.post("/savepaymentgateway",dashboardroutes.savePaymentGateway);
router.post("/savepaymentgateway/:id",dashboardroutes.savePaymentGateway);
router.delete("/paymentgatewaydelete/:id", dashboardroutes.deletePaymentGateway);


//generte description by Ai
router.post('/generateDescription', dashboardroutes.generateDescription);
router.post('/generateMetaAll', dashboardroutes.generateMetaAll);

//seo setting
router.post("/savesection",upload.singleWithSizeError("image"),upload.validateDimensions, dashboardroutes.updateSectionByType);
router.get("/sectionjson/:type", dashboardroutes.getSectionByTypeJson);
router.get("/seo", dashboardroutes.getSeoPage);
router.get("/seo/:type", dashboardroutes.getSeoByType);
router.post("/seo/save", dashboardroutes.saveSeo);

// email templates
router.get("/emailtemplates", dashboardroutes.emailTemplateListPage);
router.get("/emailtemplates/json", dashboardroutes.EmailTemplateJson);
router.post("/updateemailtemplate/:type", dashboardroutes.updateEmailTemplate);
 
// PortfolioRender page
router.get('/portfolio', dashboardroutes.getPortfolio);
router.get('/portfoliojson', dashboardroutes.getPortfolioJson);
router.post('/portfoliosave', upload.singleWithSizeError("image"),upload.validateDimensions, dashboardroutes.savePortfolio);
router.delete('/portfoliodelete/:id', dashboardroutes.deletePortfolio);

// CTA Section
router.get('/cta',dashboardroutes.getCtaSection)

//Export data base
router.get('/exportdatabase',dashboardroutes.getExportdatabase)
router.get("/exportdatabasezip", dashboardroutes.exportDatabase);

//Export payment  data 
router.get("/exportpaymentsexcel", dashboardroutes.exportPaymentsExcel);

// api key setting
router.get("/getapikeysetting",dashboardroutes.getapikeysetting)
router.post("/Apikeysettingupdate", dashboardroutes.updateApikeySettings);

// web history
router.get('/webhistoryjson', dashboardroutes.getwebhistroyJSON);
router.get('/getWebhistory', dashboardroutes.getWebhistory);

// page details
router.get('/getPagedetails', dashboardroutes.getAddPages);
router.post('/addpagedetails', dashboardroutes.addPage);

// contact page
router.get('/getContactpage',dashboardroutes.getContactpage);
router.post('/login-as-user/:userId', dashboardroutes.loginasuser);

// Language 
router.get("/language", dashboardroutes.getLanguage);
router.get("/languagejson", dashboardroutes.getLanguageJson);
router.post("/languagesave", dashboardroutes.saveLanguage);
router.delete("/languagedelete/:id", dashboardroutes.deleteLanguage);

//Translation Managers
router.get('/translationmanager', dashboardroutes.getTranslationManager)
router.get("/getlanguageselect", dashboardroutes.getlanguageselect);
router.get("/gettranslationmanagerjson", dashboardroutes.getTranslationMangerJson);
router.post("/savetranslationmanages", dashboardroutes.saveTranslationManagers);
router.delete("/deletetranslationmanagers/:id", dashboardroutes.deleteTranslationManagers);
router.post("/translationmanagerstatus/:id", dashboardroutes.toggleTranslationManager);


// Translation keys
router.get('/addtranslationkey/:id', dashboardroutes.renderTranslationKeyPage)
router.get('/gettranslationmanagerkeys/:id', dashboardroutes.getTranslationManagerKeys)
router.post("/translationnewkeyadd", dashboardroutes.translationNewKeyAdd);
router.post("/savetranslationmanagerkeys", dashboardroutes.saveTranslationManagersKeys);
router.get("/deletetranslationkey", dashboardroutes.deleteTranslationKeys);

// Auth Setting
router.get("/getauthsettings",dashboardroutes.getAuthkeysetting)
router.post("/saveauthsetting", dashboardroutes.updateAuthApikeySettings);

module.exports = router;
 