/* eslint-disable ghost/ember/alias-model-in-controller */
import Controller from '@ember/controller';
import RSVP from 'rsvp';
import {alias, sort} from '@ember/object/computed';
import {computed, get} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

const ROLES = [{
    name: 'All users',
    value: null
}, {
    name: 'Your Contributors',
    value: 'Contributors'
}, {
    name: 'Owner',
    value: 'Owner'
}, {
    name: 'Administrators',
    value: 'Administrator'
}, {
    name: 'Editors',
    value: 'Editor'
}, {
    name: 'Authors',
    value: 'Author'
}, {
    name: 'Contributors',
    value: 'Contributor'
}];

export default Controller.extend({
    session: service(),
    store: service(),

    showInviteUserModal: false,

    role: null,

    inviteOrder: null,
    userOrder: null,
    _availableRoles: null,

    init() {
        this._super(...arguments);
        this.inviteOrder = ['email'];
        this.userOrder = ['name', 'email'];
        this._availableRoles = ROLES;
    },

    currentUser: alias('model'),

    sortedInvites: sort('filteredInvites', 'inviteOrder'),
    sortedActiveUsers: sort('activeUsers', 'userOrder'),
    sortedSuspendedUsers: sort('suspendedUsers', 'userOrder'),

    invites: computed(function () {
        return this.store.peekAll('invite');
    }),

    availableRoles: computed('_availableRoles.[]', 'currentUser', function () {
        let options = this.get('_availableRoles');
        if (this.get('currentUser').isAuthorOrContributor) {
            return options.filter(role => role.value !== 'Contributors');
        }
        return options;
    }),

    selectedRole: computed('role', function () {
        let roles = this.get('availableRoles');
        return roles.findBy('value', this.get('role'));
    }),

    filteredInvites: computed('invites.@each.isNew', function () {
        return this.invites.filterBy('isNew', false);
    }),

    allUsers: computed(function () {
        return this.store.peekAll('user');
    }),

    activeUsers: computed('allUsers.@each.{status,roles,parentId}', 'role', 'currentUser', function () {
        let role = this.role;
        return this.allUsers.filter((user) => {
            let isParent = false;
            if (role === 'Contributors') {
                isParent = this.currentUser.get('id') === user.parentId && user.roles.get('firstObject').name === 'Contributor';
            }
            return user.status !== 'inactive' && (role ? isParent || user.roles.get('firstObject').name === role : true);
        });
    }),

    suspendedUsers: computed('allUsers.@each.{status,roles,parentId}', 'role','currentUser', function () {
        let role = this.role;
        return this.allUsers.filter((user) => {
            let isParent = false;
            if (role === 'Contributors') {
                isParent = this.currentUser.get('id') === user.parentId && user.roles.get('firstObject').name === 'Contributor';
            }
            return user.status === 'inactive' && (role ? isParent || user.roles.get('firstObject').name === role : true);
        });
    }),

    actions: {
        toggleInviteUserModal() {
            this.toggleProperty('showInviteUserModal');
        },
        changeRole(role) {
            this.set('role', get(role, 'value'));
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
        yield this.store.query('user', {limit: 'all', include: 'parents'});
    }),

    fetchInvites: task(function* () {
        if (this.currentUser.isAuthorOrContributor) {
            return;
        }

        // ensure roles are loaded before invites. Invites do not have embedded
        // role records which means Ember Data will try to fetch the roles
        // automatically when invite.role is queried, loading roles first makes
        // them available in memory and cuts down on network noise
        let knownRoles = this.store.peekAll('role');
        if (knownRoles.length <= 1) {
            yield this.store.query('role', {limit: 'all'});
        }

        return yield this.store.query('invite', {limit: 'all'});
    })
});
