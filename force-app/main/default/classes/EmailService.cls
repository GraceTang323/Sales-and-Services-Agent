public with sharing class EmailService {
    public class EmailRequest {
        public String toAddress;
        public String subject;
        public String body;
    }

    /**
     * Sends an email to the specified address receiver
     */
    public static Boolean sendPlainTextEmail(List<EmailRequest> requests) {
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for (EmailRequest req: requests) {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();

            mail.setToAddresses(new String[] { req.toAddress });
            mail.setSubject(req.subject);
            mail.setPlainTextBody(req.body);

            emails.add(mail);
        }

        // send all emails as a batch operation
        if (!emails.isEmpty()) {
            Messaging.SendEmailResult[] results = Messaging.sendEmail(emails);
            
            return inspectResults(results);
        }

        return false;
    }

    /**
     * Helper function to verify if an email was delivered successfully or not
     */
    private static Boolean inspectResults(Messaging.SendEmailResult[] results) {
        Boolean result = true;
        for (Messaging.SendEmailResult res: results) {
            if (!res.isSuccess()) {
                result = false;
                System.debug('An error occurred while sending email: ' + res.getErrors()[0].getMessage());
            }
        }
        System.debug('All emails sent successfully.');
        return result;
    }
}