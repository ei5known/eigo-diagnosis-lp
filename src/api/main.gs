function doPost(e) {
  const path = e.parameter.path;
  let output;

  switch (path) {
    case "paypal_webhook":
      output = handlePayPalWebhook(e);
      break;
    case "diagnosis":
      output = handleDiagnosis(e);
      break;
    case "karte":
      output = handleKarte(e);
      break;
    case "step2":
      output = handleStep2(e);
      break;
    default:
      output = ContentService.createTextOutput("Invalid path").setMimeType(ContentService.MimeType.TEXT);
      break;
  }
  return output;
}