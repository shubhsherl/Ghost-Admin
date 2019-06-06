import ModalComponent from 'ghost-admin/components/modal-base';
import RSVP from 'rsvp';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {A as emberA} from '@ember/array';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

const {Promise} = RSVP;

export default ModalComponent.extend(ValidationEngine, {
    notifications: service(),
    store: service(),
    rcService: service('rc-services'),

    classNames: 'modal-content invite-new-user',

    role: null,
    roles: null,
    authorRole: null,

    validationType: 'inviteUser',

    init() {
        this._super(...arguments);
    },

    didInsertElement() {
        this._super(...arguments);
        this.fetchRoles.perform();
    },

    willDestroyElement() {
        this._super(...arguments);
        // TODO: this should not be needed, ValidationEngine acts as a
        // singleton and so it's errors and hasValidated state stick around
        this.errors.clear();
        this.set('hasValidated', emberA());
    },

    actions: {
        setRole(role) {
            this.set('role', role);
            this.errors.remove('role');
        },

        confirm() {
            this.sendInvitation.perform();
        }
    },

    validate() {
        let username = this.username;

        // TODO: either the validator should check the username's existence or
        // the API should return an appropriate error when attempting to save
        return new Promise((resolve, reject) => this._super().then(() => RSVP.hash({
            rc_users: this.rcService.getUser(username),
            users: this.store.findAll('user', {reload: true})
        }).then((data) => {
            let existingRCUser = data.rc_users.data[0].exist;
            let existingUser = data.users.findBy('rc_username', username);

            if (existingUser || !existingRCUser) {
                this.errors.clear('username');
                if (existingUser) {
                    this.errors.add('username', 'A user with that username already exists.');
                } else {
                    this.errors.add('username', 'Username doesnot exist');
                }

                // TODO: this shouldn't be needed, ValidationEngine doesn't mark
                // properties as validated when validating an entire object
                this.hasValidated.addObject('username');
                reject();
            } else {
                resolve();
            }
        }), () => {
            // TODO: this shouldn't be needed, ValidationEngine doesn't mark
            // properties as validated when validating an entire object
            this.hasValidated.addObject('username');
            reject();
        }));
    },

    fetchRoles: task(function * () {
        let roles = yield this.store.query('role', {permissions: 'assign'});
        let authorRole = roles.findBy('name', 'Author');

        this.set('roles', roles);
        this.set('authorRole', authorRole);

        if (!this.role) {
            this.set('role', authorRole);
        }
    }),

    sendInvitation: task(function* () {
        let username = this.username;
        let role = this.role;
        let notifications = this.notifications;

        try {
            yield this.validate();

            const user = yield this.rcService.addUser(username, role);

            // Check and notify if user is added
            if (user.invitation && user.invitation[0].message === 'User Added') {
                notifications.showNotification(user.invitation[0].message, {key: 'invite.send.success'});
            } else {
                notifications.showAlert('Unable to add user', {type: 'error', key: 'invite.send.failed'});
            }

            this.send('closeModal');
        } catch (error) {
            // validation will reject and cause this to be called with no error
            if (error) {
                // invite.deleteRecord();
                notifications.showAPIError(error, {key: 'invite.send'});
                this.send('closeModal');
            }
        }
    }).drop()
});
