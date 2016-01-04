/**
 * Created by zain on 12/28/15.
 */

buildfire._parentPost = function (p) {
    var packet = JSON.parse(p);
    var replyPacket = new Packet(packet.id, packet.cmd, mockResult);
    replyPacket.error = mockErr;
    buildfire._postMessageHandler({
        id: packet.id,
        data: JSON.stringify(replyPacket),
        source: null
    });
}
