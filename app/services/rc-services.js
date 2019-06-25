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
        let url = this.get('ghostPaths.url').api('authentication', 'adduser');
        return this.ajax.post(url, {
            dataType: 'json',
            data: {
                user: [{
                    rc_username: username,
                    role: role
                }]
            }
        });
    },

    collaborate(userId, postId, post) {
        let url = this.get('ghostPaths.url').api('rcapi', 'collaborate');
        return this.ajax.post(url, {
            dataType: 'json',
            data: {
                collaboration: [{
                    rc_id: userId,
                    post_id: postId,
                    post: post
                }]
            }
        });
    }
});
