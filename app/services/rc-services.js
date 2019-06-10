import Service, {inject as service} from '@ember/service';

export default Service.extend({
    ajax: service(),
    ghostPaths: service(),
    session: service(),

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
        const pid = this.get('session.user.id');
        return this.ajax.post(url, {
            dataType: 'json',
            user: {id: '1'},
            data: {
                user: [{
                    rc_username: username,
                    role: role,
                    created_by: pid
                }]
            }
        });
    },

    createDiscussion(title) {
        const url = this.get('ghostPaths.url').api('rcapi', 'discussion');
        return this.ajax.post(url, {
            dataType: 'json',
            data: {
                room: [{
                    title: title
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
