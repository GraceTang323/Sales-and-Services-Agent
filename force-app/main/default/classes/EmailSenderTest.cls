@isTest
private class EmailSenderTest {

    private static String addr = 'test@gmail.com';
    private static String subject = 'test subject';
    private static String body = 'Hello world!';

    private static EmailSender.SendResponse fetchSingle(String toAddress, String subject, String body) {
        EmailSender.SendRequest req = new EmailSender.SendRequest();
        req.toAddress = toAddress;
        req.emailSubject = subject;
        req.emailBody = body;

        return EmailSender.sendEmail(new List<EmailSender.SendRequest>{ req })[0];
    }

    @IsTest static void testSendEmail() {

        Test.startTest();
        EmailSender.SendResponse res = fetchSingle(addr, subject, body);
        Test.stopTest();

        Assert.isTrue(res.emailSent);
        Assert.isTrue(res.emailError == '');
    }

    @IsTest static void testSendInvalidEmail() {
        String badAddr = 'testg123.com';

        Test.startTest();
        EmailSender.SendResponse res = fetchSingle(badAddr, subject, body);
        Test.stopTest();

        Assert.isFalse(res.emailSent);
        Assert.isTrue(res.emailError.startsWithIgnoreCase('Email sending failed:'), 'Invalid or no error message given for invalid email: ' + res.emailError);
    }

    @IsTest static void testSendMissingParams() {

        Test.startTest();
        EmailSender.SendResponse resSubject = fetchSingle(addr, '', body);
        EmailSender.SendResponse resBody = fetchSingle(addr, subject, '');
        Test.stopTest();

        Assert.isFalse(resSubject.emailSent);
        Assert.isTrue(resSubject.emailError.equalsIgnoreCase('Recipient, subject, and body are required.'), 'Invalid or no error message given for missing subject: ' + resSubject.emailError);

        Assert.isFalse(resBody.emailSent);
        Assert.isTrue(resBody.emailError.equalsIgnoreCase('Recipient, subject, and body are required.'), 'Invalid or no error message given for missing body: ' + resBody.emailError);
    }
    
}