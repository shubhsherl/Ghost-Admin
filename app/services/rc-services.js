import Service, {inject as service} from '@ember/service';

export default Service.extend({
    ajax: service(),
    ghostPaths: service(),

    init() {
        this._super(...arguments);
    },

    getRoom(room) {
        const query = {rname: room};
        let url = this.get('ghostPaths.url').api('rcapi');
        return this.ajax.request(url, {data: query});
    },

    getUser(username) {
        const query = {uname: username};
        let url = this.get('ghostPaths.url').api('rcapi');
        return this.ajax.request(url, {data: query});
    },

    addUser(username, role) {
        let authUrl = this.get('ghostPaths.url').api('authentication', 'adduser');
        return this.ajax.post(authUrl, {
            dataType: 'json',
            data: {
                user: [{
                    rc_username: username,
                    role: role
                }]
            }
        });
    },
    // collaborate(user, post) {
    //     let authUrl = this.get('ghostPaths.url').api('rcapi', 'collaborate');
    //     return this.ajax.post(authUrl, {
    //         dataType: 'json',
    //         data: {
    //             user: [{
    //                 rc_username: username,
    //                 role: role
    //             }]
    //         }
    //     });
    // }
});
