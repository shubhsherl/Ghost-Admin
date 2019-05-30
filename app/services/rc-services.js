import Service, { inject as service } from '@ember/service';

export default Service.extend({
    ajax: service(),
    ghostPaths: service(),

    init() {
        this._super(...arguments);
    },

    importUsers() {
        const base = this.ghostPaths.rcApi;
        const query = {
            invites: [{
                role: 'author',
                apiUrl: base+'users.list'
            }]
        };
        // this.notifications.showAlert('yo', {type: 'error', key: 'invite.send'});
        return this.ajax.post('/ghost/api/v2/admin/invites', { data: query });
    },

    checkRoom(room) {
        const base = this.ghostPaths.rcApi;
        const userId = 'AZG7dyTXMJoPhJHE7';
        const authToken = 'AQlnaFgDczayLPngn-HdHABIomE2EjV_LMHAW0lvV1X';
        const options = {
            headers: {
                'X-Auth-Token': authToken,
                'X-User-Id': userId,
                'Content-Type': 'application/json'
                // 'Access-Control-Allow-Origin': '*',
                // "accept": "application/json"
            },
            // crossDomain: true,
            // method: "GET",
            dataType: 'jsonp',
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('X-Auth-Token',authToken);xhr.setRequestHeader('X-User-Id',userId); }
        };
        return this.ajax.request(base + 'channels.list?query={"name":"'+room+'"}&fields={"_id":1,"name":1}', options);
    }
});
