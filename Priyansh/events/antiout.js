module.exports.config = {
 name: "antiout",
 eventType: ["log:unsubscribe"],
 version: "0.0.1",
 credits: "Ashikur Rahman",
 description: "Listen events"
};

module.exports.run = async({ event, api, Threads, Users }) => {
 let data = (await Threads.getData(event.threadID)).data || {};
 if (data.antiout == false) return;
 if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;
 const name = global.data.userName.get(event.logMessageData.leftParticipantFbId) || await Users.getNameUser(event.logMessageData.leftParticipantFbId);
 const type = (event.author == event.logMessageData.leftParticipantFbId) ? "self-separation" : "keu aivabe pachay mare?";
 if (type == "self-separation") {
  api.addUserToGroup(event.logMessageData.leftParticipantFbId, event.threadID, (error, info) => {
   if (error) {
    api.sendMessage(`take abr add korte parlam na 🥺 ${name} Group Mai :( `, event.threadID)
   } else api.sendMessage(`paliye kothay jao, ${name} Baby, Dekho tmake abr add kore disi`, event.threadID);
  })
 }
}
