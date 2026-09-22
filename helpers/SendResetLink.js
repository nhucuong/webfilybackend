const getTransporter = require("./EmailHelper"); 
const EmailTemplate = require("../models/EmailTemplate");
const { normalizeHtml }=require("./Htmlnormalize")

async function sendTemplateEmail(type, toEmail, data = {}) {
  try {
    const template = await EmailTemplate.findOne({ type }).lean();
    if (!template) throw new Error(`Email template not found: ${type}`);

    const replaceVars = (str = "") =>
      str.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key] ?? "");

    const subject = replaceVars(template.subject);
    const fromEmail = replaceVars(template.from_email) ;
    const fromName = replaceVars(template.from_name);

    let rawContent = template.htmlContent;

    let html = rawContent;

    if (html.includes("{{site_logo}}")) {
      const logoUrl = data.site_logo || "";

      const logoImgTag = logoUrl
        ? `<img src="${logoUrl}" alt="Logo" style="max-width:150px; height:auto;" />`
        : "";

      html = html.replace(/{{site_logo}}/g, logoImgTag);
    }

    html = replaceVars(html);
     const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject,
      html,
    });
    
    return true;
  } catch (error) {
    console.error("Email Sending Error:", error);
    return false;
  }
}

module.exports = sendTemplateEmail;