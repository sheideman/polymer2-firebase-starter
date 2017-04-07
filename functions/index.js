const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const request = require('request-promise');

const LANGUAGES = ['es', 'it'];
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   console.log('request object:  ', request, 'response object:', response)
//  response.send("Hello from Firebase!" );
// });
// // const WEBHOOK_URL = 'http://requestb.in/qu0j0squ';
// // exports.webhook = functions.database.ref('/users/{user}/notes/{note}/content').onWrite(event => {
// //   return request({
// //     uri: WEBHOOK_URL,
// //     method: 'POST',
// //     json: true,
// //     body: event.data.val(),
// //     resolveWithFullResponse: true
// //   }).then(response => {
// //     if (response.statusCode >= 400) {
// //       throw new Error(`HTTP Error: ${response.statusCode}`);
// //     }
// //     console.log('SUCCESS! Posted', event.data.ref);
// //   });
// // });
// // Translate an incoming message.
exports.translation = functions.database.ref('/users/{user}/notes/{note}/en/content').onWrite(event => {
  const snapshot = event.data;
const source = 'en';
console.log('path',event.data.ref.path.o[3])
const noteId = event.data.ref.path.o[3]
const usrId = event.data.ref.parent.path.o[1];
const translated = snapshot.val().translated
  if (translated) {
    return;
  }
  const promises = [];
  for (let i = 0; i < LANGUAGES.length; i++) {
    var language = LANGUAGES[i];
    if (language !== source) {
      promises.push(createTranslationPromise(source, language, snapshot, usrId, noteId));
    }
  }
  return Promise.all(promises);
});
//
// // // URL to the Google Translate API.
function createTranslateUrl(source, target, payload) {
  console.log(`https://www.googleapis.com/language/translate/v2?key=${functions.config().firebase.apiKey}&source=en&target=${target}&q=${payload}`)
  return `https://www.googleapis.com/language/translate/v2?key=${functions.config().firebase.apiKey}&source=en&target=${target}&q=${payload}`;
}
// //
function createTranslationPromise(source, target, snapshot, usrId,noteId) {
  const key = noteId;
  const note = snapshot.val();
  console.log('usrId', usrId)
  return request(createTranslateUrl(source, target, note), {resolveWithFullResponse: true}).then(
      response => {
        if (response.statusCode === 200) {
          const data = JSON.parse(response.body).data;
          console.log('key',key)
          return admin.database().ref(`/users/${usrId}/notes/${key}/${target}/`)
              .set({content: data.translations[0].translatedText, translated: true});
        }
        throw response.body;
      });
}
