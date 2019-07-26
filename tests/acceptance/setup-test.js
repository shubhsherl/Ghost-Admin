import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {beforeEach, describe, it} from 'mocha';
import {currentURL, find} from '@ember/test-helpers';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../helpers/visit';

describe('Acceptance: Setup', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    it('redirects if already authenticated', async function () {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();

        await visit('/setup');
        expect(currentURL()).to.equal('/site');
    });

    it('redirects to signin if already set up', async function () {
        // mimick an already setup blog
        this.server.get('/authentication/setup/', function () {
            return {
                setup: [
                    {status: true}
                ]
            };
        });

        await invalidateSession();

        await visit('/setup');
        expect(currentURL()).to.equal('/signin');
    });

    describe('with a new blog', function () {
        beforeEach(function () {
            // mimick a new blog
            this.server.get('/authentication/setup/', function () {
                return {
                    setup: [
                        {status: false}
                    ]
                };
            });
        });

        it('has a successful happy path', async function () {
            await invalidateSession();
            this.server.loadFixtures('roles');

            await visit('/setup');

            // it redirects to setup
            expect(currentURL(), 'url after accessing /setup')
                .to.equal('/setup');

            // it displays download count (count increments for each ajax call
            // and polling is disabled in testing so our count should be "1"
            expect(find('.gh-flow-content em').textContent.trim()).to.equal('1');
        });
    });
});
