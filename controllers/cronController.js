if (process.env.NODE_ENV !== "production") require("dotenv").config();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_KEY);
const Event = require("../models/Events");
const Tickets = require("../models/Tickets");

exports.sendReminderEmails = async (req, res, next) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Adjust the time to 00:00:00 for accurate comparison
  tomorrow.setHours(0, 0, 0, 0);

  const nextDay = new Date(tomorrow);
  nextDay.setDate(nextDay.getDate() + 1);

  try {
    const events = await Event.find({
      startDate: {
        $gte: tomorrow,
        $lt: nextDay,
      },
    });

    for (const event of events) {
      const tickets = await Tickets.find({ eventId: event._id });

      for (let ticket of tickets) {
        const msg = {
          to: ticket.customerEmail,
          from: {
            email: "wasif.shahid8@gmail.com",
            name: "Experience Pakistan",
          },
          subject: `Reminder: Your event "${event.name}" is tomorrow!`,
          html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h1>📅 Event Reminder!</h1>
            <p>Dear ${ticket.customerName},</p>
            <p>This is a reminder that your event, <strong>${event.name}</strong>, is happening tomorrow!</p>
            <div style="text-align: center;">
              <img src="${event.imageUrl}" alt="${event.name}" style="max-width: 100%; height: auto;" />
            </div>
            <p>We hope everything is set and ready. If you have any questions or need assistance, feel free to reach out.</p>
            <p>Best regards,</p>
            <p><strong>The Experience Pakistan Team</strong></p>
          </div>
        `,
        };
        await sgMail.send(msg);
        console.log("email sent");
      }
    }

    next();
  } catch (error) {
    console.error("Error sending reminder emails:", error);
  }
};
