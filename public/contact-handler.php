<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.',
    ]);
    exit;
}

function clean_value(string $value): string {
    return trim(str_replace(["\r", "\n"], ' ', $value));
}

$fullName = clean_value($_POST['full_name'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$phone = clean_value($_POST['phone'] ?? '');
$branch = clean_value($_POST['branch'] ?? '');
$subject = clean_value($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($fullName === '' || !$email || $subject === '' || $message === '') {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Please provide your name, valid email, subject, and message.',
    ]);
    exit;
}

$recipient = 'circleoffriends.cm@gmail.com';
$mailSubject = 'Circle of Friends Contact: ' . $subject;

$bodyLines = [
    'Circle of Friends contact form submission',
    '',
    'Full Name: ' . $fullName,
    'Email: ' . $email,
    'Phone: ' . ($phone !== '' ? $phone : 'Not provided'),
    'Branch/Location: ' . ($branch !== '' ? $branch : 'Not provided'),
    'Subject: ' . $subject,
    '',
    'Message:',
    $message,
];

$body = implode(PHP_EOL, $bodyLines);

$headers = [
    'From: Circle of Friends Website <no-reply@circleoffriends.cm>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
];

$sent = @mail($recipient, $mailSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Message could not be delivered by the PHP mail handler.',
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Your message has been sent successfully.',
]);
