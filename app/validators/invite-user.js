import BaseValidator from './base';
import {isBlank} from '@ember/utils';

export default BaseValidator.create({
    properties: ['username', 'role'],

    username(model) {
        let username = model.get('username');

        if (isBlank(username)) {
            model.get('errors').add('username', 'Please enter a username.');
            this.invalidate();
        }
    },

    role(model) {
        let role = model.get('role');

        if (isBlank(role)) {
            model.get('errors').add('role', 'Please select a role.');
            model.get('hasValidated').pushObject('role');
            this.invalidate();
        }
    }
});
