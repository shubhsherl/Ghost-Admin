import Service, {inject as service} from '@ember/service';

export default Service.extend({
    ajax: service(),
    ghostPaths: service(),

    init() {
        this._super(...arguments);
    },

    getUser(username) {
        const query = {name: username};
        let url = this.get('ghostPaths.url').api('rcapi');
        return this.ajax.request(url, {data: query})
            .then((u) => {
                return u;
            });
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
    }
});
