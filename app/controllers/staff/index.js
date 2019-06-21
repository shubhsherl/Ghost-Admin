/* eslint-disable ghost/ember/alias-model-in-controller */
import Controller from '@ember/controller';
import RSVP from 'rsvp';
import {alias, sort} from '@ember/object/computed';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default Controller.extend({
    session: service(),
    store: service(),

    showInviteUserModal: false,

    userOrder: null,

    init() {
        this._super(...arguments);
        this.inviteOrder = ['email'];
        this.userOrder = ['name', 'email'];
    },

    currentUser: alias('model'),

    sortedActiveUsers: sort('activeUsers', 'userOrder'),
    sortedSuspendedUsers: sort('suspendedUsers', 'userOrder'),

    allUsers: computed(function () {
        return this.store.peekAll('user');
    }),

    activeUsers: computed('allUsers.@each.status', function () {
        return this.allUsers.filter((user) => {
            return user.status !== 'inactive';
        });
    }),

    suspendedUsers: computed('allUsers.@each.status', function () {
        return this.allUsers.filter((user) => {
            return user.status === 'inactive';
        });
    }),

    actions: {
        toggleInviteUserModal() {
            this.toggleProperty('showInviteUserModal');
        }
    },

    backgroundUpdate: task(function* () {
        let users = this.fetchUsers.perform();
        let invites = this.fetchInvites.perform();

        try {
            yield RSVP.all([users, invites]);
        } catch (error) {
            this.send('error', error);
        }
    }),

    fetchUsers: task(function* () {
        yield this.store.query('user', {limit: 'all'});
    })
});
