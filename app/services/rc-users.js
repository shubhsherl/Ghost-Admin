import Service, { inject as service } from '@ember/service';

export default Service.extend({
    ajax: service(),
    ghostPaths: service(),

    init() {
        this._super(...arguments);
    },

    importUsers() {
        let siteUrl = this.ghostPaths.rcUserApi;
        let query = {
            invites: [{
                role: 'author',
                apiUrl: siteUrl
            }]
        };
        // this.notifications.showAlert('yo', {type: 'error', key: 'invite.send'});
        return this.ajax.post('/ghost/api/v2/admin/invites', { data: query });
    }
});
