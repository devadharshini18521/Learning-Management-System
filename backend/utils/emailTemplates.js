/**
 * Email templates for course enrollment notifications
 */

const getEnrollmentEmailTemplate = (userName, courseTitle, courseDescription, courseThumbnail) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Enrollment</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎓 Course Enrollment</h1>
            <p style="color: #c7d2fe; margin: 10px 0 0 0; font-size: 16px;">Zoho Learning</p>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 30px;">
            <p style="color: #1f2937; font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Congratulations! You have been successfully enrolled in a new course.
            </p>
            
            <!-- Course Info -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; overflow: hidden; margin: 20px 0;">
              <tr>
                ${courseThumbnail ? `
                <td style="padding: 0;">
                  <img src="${courseThumbnail}" alt="${courseTitle}" style="width: 100%; max-width: 200px; height: auto; display: block;">
                </td>
                ` : ''}
                <td style="padding: 20px;">
                  <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 20px;">${courseTitle}</h3>
                  ${courseDescription ? `<p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.5;">${courseDescription.substring(0, 150)}${courseDescription.length > 150 ? '...' : ''}</p>` : ''}
                </td>
              </tr>
            </table>
            
            <!-- CTA Button -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 20px 0; text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/courses" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Start Learning
                  </a>
                </td>
              </tr>
            </table>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              We're excited to have you on this learning journey! Start exploring your new course today.
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated notification from Zoho Learning.<br>
              Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const getBulkEnrollmentEmailTemplate = (userName, courses) => {
  const courseListHtml = courses.map(course => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            ${course.thumbnail ? `
            <td style="width: 80px; padding-right: 15px;">
              <img src="${course.thumbnail}" alt="${course.title}" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px;">
            </td>
            ` : ''}
            <td>
              <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">${course.title}</p>
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">${course.category || 'General'}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bulk Course Enrollment</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📚 Bulk Enrollment</h1>
            <p style="color: #c7d2fe; margin: 10px 0 0 0; font-size: 16px;">Zoho Learning</p>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 30px;">
            <p style="color: #1f2937; font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Great news! You have been enrolled in ${courses.length} course${courses.length > 1 ? 's' : ''} by your administrator.
            </p>
            
            <!-- Course List -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; overflow: hidden; margin: 20px 0;">
              <tr>
                <td style="padding: 15px;">
                  <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 10px 0;">Enrolled Courses:</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    ${courseListHtml}
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- CTA Button -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 20px 0; text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/courses" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    View My Courses
                  </a>
                </td>
              </tr>
            </table>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Start your learning journey today! Each course is designed to help you grow your skills and knowledge.
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated notification from Zoho Learning.<br>
              Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

module.exports = {
  getEnrollmentEmailTemplate,
  getBulkEnrollmentEmailTemplate
};

