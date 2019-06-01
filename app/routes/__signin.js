import DS from 'ember-data';
import EmberObject from '@ember/object';
import Route from '@ember/routing/route';
import UnauthenticatedRouteMixin from 'ghost-admin/mixins/unauthenticated-route-mixin';
import {inject as service} from '@ember/service';

const {Errors} = DS;

const defaultModel = function defaultModel() {
    return EmberObject.create({
        identification: '',
        password: '',
        errors: Errors.create()
    });
};

export default Route.extend(UnauthenticatedRouteMixin, {
    cookies: service(),
    model(params) {

        return new Promise((resolve) => {
            if (!params.token) {
                this.notifications.showAlert('Invalid token', {type: 'error', delayed: true, key: 'signup.create.invalid-token'});

                return resolve(this.transitionTo('error404'));
            }

            let tokenText = params.token;
            let cookieService = this.get('cookies');
            cookieService.write('ghost-admin-api-session', tokenText);
            return resolve(this.transitionTo('home'));

            // let authUrl = this.get('ghostPaths.url').api('authentication', 'invitation');

            // return this.ajax.request(authUrl, {
            //     dataType: 'json',
            //     data: {
            //         email
            //     }
            // }).then((response) => {
            //     if (response && response.invitation && response.invitation[0].valid === false) {
            //         this.notifications.showAlert('The invitation does not exist or is no longer valid.', {type: 'warn', delayed: true, key: 'signup.create.invalid-invitation'});

            //         return resolve(this.transitionTo('signin'));
            //     }

            //     // set blogTitle, so password validation has access to it
            //     signupDetails.set('blogTitle', this.get('config.blogTitle'));

            //     resolve(signupDetails);
            // }).catch(() => {
            //     resolve(signupDetails);
            // });
        });
    },

    // the deactivate hook is called after a route has been exited.
    deactivate() {
        let controller = this.controllerFor('signin');

        this._super(...arguments);

        // clear the properties that hold the credentials when we're no longer on the signin screen
        controller.set('signin', defaultModel());
    },

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Sign In',
            bodyClasses: ['unauthenticated-route']
        };
    }
});
