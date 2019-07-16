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

    userOrder: null,
    _availableRoles: null,

    init() {
        this._super(...arguments);
        this.inviteOrder = ['email'];
        this.userOrder = ['name', 'email'];
        this._availableRoles = ROLES;
    },

    currentUser: alias('model'),

    sortedActiveUsers: sort('activeUsers', 'userOrder'),
    sortedSuspendedUsers: sort('suspendedUsers', 'userOrder'),

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

        try {
            yield RSVP.all([users]);
        } catch (error) {
            this.send('error', error);
        }
    }),

    fetchUsers: task(function* () {
        yield this.store.query('user', {limit: 'all', include: 'parents'});
    })
});
