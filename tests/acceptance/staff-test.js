import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import moment from 'moment';
import windowProxy from 'ghost-admin/utils/window-proxy';
import {Response} from 'ember-cli-mirage';
import {afterEach, beforeEach, describe, it} from 'mocha';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {
    blur,
    click,
    currentRouteName,
    currentURL,
    fillIn,
    find,
    findAll,
    focus,
    triggerEvent
} from '@ember/test-helpers';
import {errorOverride, errorReset} from '../helpers/adapter-error';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../helpers/visit';

describe('Acceptance: Staff', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    it('redirects to signin when not authenticated', async function () {
        await invalidateSession();
        await visit('/staff');

        expect(currentURL()).to.equal('/signin');
    });

    it('redirects correctly when authenticated as contributor', async function () {
        let role = this.server.create('role', {name: 'Contributor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        this.server.create('user', {slug: 'no-access'});

        await authenticateSession();
        await visit('/staff/no-access');

        expect(currentURL(), 'currentURL').to.equal('/staff/test-user');
    });

    it('redirects correctly when authenticated as author', async function () {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        this.server.create('user', {slug: 'no-access'});

        await authenticateSession();
        await visit('/staff/no-access');

        expect(currentURL(), 'currentURL').to.equal('/staff/test-user');
    });

    it('redirects correctly when authenticated as editor', async function () {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        this.server.create('user', {slug: 'no-access'});

        await authenticateSession();
        await visit('/staff/no-access');

        expect(currentURL(), 'currentURL').to.equal('/staff/no-access');
    });

    describe('when logged in as admin', function () {
        let admin, adminRole, suspendedUser;

        beforeEach(async function () {
            this.server.loadFixtures('roles');
            adminRole = this.server.schema.roles.find(1);

            admin = this.server.create('user', {email: 'admin@example.com', roles: [adminRole]});

            // add an expired invite
            this.server.create('invite', {expires: moment.utc().subtract(1, 'day').valueOf(), role: adminRole});

            // add a suspended user
            suspendedUser = this.server.create('user', {email: 'suspended@example.com', roles: [adminRole], status: 'inactive'});

            return await authenticateSession();
        });

        it('it renders and navigates correctly', async function () {
            let user1 = this.server.create('user');
            let user2 = this.server.create('user');

            await visit('/staff');

            // doesn't do any redirecting
            expect(currentURL(), 'currentURL').to.equal('/staff');

            // it has correct page title
            expect(document.title, 'page title').to.equal('Staff - Test Blog');

            // it shows active users in active section
            expect(
                findAll('[data-test-active-users] [data-test-user-id]').length,
                'number of active users'
            ).to.equal(3);
            expect(
                find(`[data-test-active-users] [data-test-user-id="${user1.id}"]`)
            ).to.exist;
            expect(
                find(`[data-test-active-users] [data-test-user-id="${user2.id}"]`)
            ).to.exist;
            expect(
                find(`[data-test-active-users] [data-test-user-id="${admin.id}"]`)
            ).to.exist;

            // it shows suspended users in suspended section
            expect(
                findAll('[data-test-suspended-users] [data-test-user-id]').length,
                'number of suspended users'
            ).to.equal(1);
            expect(
                find(`[data-test-suspended-users] [data-test-user-id="${suspendedUser.id}"]`)
            ).to.exist;

            await click(`[data-test-user-id="${user2.id}"]`);

            // url is correct
            expect(currentURL(), 'url after clicking user').to.equal(`/staff/${user2.slug}`);

            // title is correct
            expect(document.title, 'title after clicking user').to.equal('Staff - User - Test Blog');

            // view title should exist and be linkable and active
            expect(
                find('[data-test-screen-title] a[href="/ghost/staff"]').classList.contains('active'),
                'has linkable url back to staff main page'
            ).to.be.true;

            await click('[data-test-screen-title] a');

            // url should be /staff again
            expect(currentURL(), 'url after clicking back').to.equal('/staff');
        });

        it('can manage suspended users', async function () {
            await visit('/staff');
            await click(`[data-test-user-id="${suspendedUser.id}"]`);

            expect(find('[data-test-suspended-badge]')).to.exist;

            await click('[data-test-user-actions]');
            await click('[data-test-unsuspend-button]');
            await click('[data-test-modal-confirm]');

            // NOTE: there seems to be a timing issue with this test - pausing
            // here confirms that the badge is removed but the andThen is firing
            // before the page is updated
            // andThen(() => {
            //     expect('[data-test-suspended-badge]').to.not.exist;
            // });

            await click('[data-test-staff-link]');
            // suspendedUser is now in active list
            expect(
                find(`[data-test-active-users] [data-test-user-id="${suspendedUser.id}"]`)
            ).to.exist;

            // no suspended users
            expect(
                findAll('[data-test-suspended-users] [data-test-user-id]').length
            ).to.equal(0);

            await click(`[data-test-user-id="${suspendedUser.id}"]`);

            await click('[data-test-user-actions]');
            await click('[data-test-suspend-button]');
            await click('[data-test-modal-confirm]');
            expect(find('[data-test-suspended-badge]')).to.exist;
        });

        it('can delete users', async function () {
            let user1 = this.server.create('user');
            let user2 = this.server.create('user');
            let post = this.server.create('post', {authors: [user2]});

            // we don't have a full many-to-many relationship in mirage so we
            // need to add the inverse manually
            user2.posts = [post];
            user2.save();

            await visit('/staff');
            await click(`[data-test-user-id="${user1.id}"]`);

            // user deletion displays modal
            await click('button.delete');
            expect(
                findAll('[data-test-modal="delete-user"]').length,
                'user deletion modal displayed after button click'
            ).to.equal(1);

            // user has no posts so no warning about post deletion
            expect(
                findAll('[data-test-text="user-post-count"]').length,
                'deleting user with no posts has no post count'
            ).to.equal(0);

            // cancelling user deletion closes modal
            await click('[data-test-button="cancel-delete-user"]');
            expect(
                findAll('[data-test-modal]').length === 0,
                'delete user modal is closed when cancelling'
            ).to.be.true;

            // deleting a user with posts
            await visit('/staff');
            await click(`[data-test-user-id="${user2.id}"]`);

            await click('button.delete');
            // user has  posts so should warn about post deletion
            expect(
                find('[data-test-text="user-post-count"]').textContent,
                'deleting user with posts has post count'
            ).to.have.string('1 post');

            await click('[data-test-button="confirm-delete-user"]');
            // redirected to staff page
            expect(currentURL()).to.equal('/staff');

            // deleted user is not in list
            expect(
                findAll(`[data-test-user-id="${user2.id}"]`).length,
                'deleted user is not in user list after deletion'
            ).to.equal(0);
        });

        describe('existing user', function () {
            let newLocation, originalReplaceState;

            beforeEach(function () {
                this.server.create('user', {
                    slug: 'test-1',
                    name: 'Test User',
                    facebook: 'test',
                    twitter: '@test'
                });

                originalReplaceState = windowProxy.replaceState;
                windowProxy.replaceState = function (params, title, url) {
                    newLocation = url;
                };
                newLocation = undefined;
            });

            afterEach(function () {
                windowProxy.replaceState = originalReplaceState;
            });

            it('input fields reset and validate correctly', async function () {
                // test user name
                await visit('/staff/test-1');

                expect(currentURL(), 'currentURL').to.equal('/staff/test-1');
                expect(find('[data-test-name-input]').value, 'current user name').to.equal('Test User');

                expect(find('[data-test-save-button]').textContent.trim(), 'save button text').to.equal('Save');

                // test empty user name
                await fillIn('[data-test-name-input]', '');
                await blur('[data-test-name-input]');

                expect(find('.user-details-bottom .first-form-group').classList.contains('error'), 'username input is in error state with blank input').to.be.true;

                // test too long user name
                await fillIn('[data-test-name-input]', new Array(195).join('a'));
                await blur('[data-test-name-input]');

                expect(find('.user-details-bottom .first-form-group').classList.contains('error'), 'username input is in error state with too long input').to.be.true;

                // reset name field
                await fillIn('[data-test-name-input]', 'Test User');

                expect(find('[data-test-slug-input]').value, 'slug value is default').to.equal('test-1');

                await fillIn('[data-test-slug-input]', '');
                await blur('[data-test-slug-input]');

                expect(find('[data-test-slug-input]').value, 'slug value is reset to original upon empty string').to.equal('test-1');

                // Save changes
                await click('[data-test-save-button]');

                expect(find('[data-test-save-button]').textContent.trim(), 'save button text').to.equal('Saved');

                // CMD-S shortcut works
                await fillIn('[data-test-slug-input]', 'Test User');
                await triggerEvent('.gh-app', 'keydown', {
                    keyCode: 83, // s
                    metaKey: ctrlOrCmd === 'command',
                    ctrlKey: ctrlOrCmd === 'ctrl'
                });

                // we've already saved in this test so there's no on-screen indication
                // that we've had another save, check the request was fired instead
                let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
                let params = JSON.parse(lastRequest.requestBody);

                expect(params.users[0].name).to.equal('Test User');

                // check that the history state has been updated
                expect(newLocation).to.equal('Test User');

                await fillIn('[data-test-slug-input]', 'white space');
                await blur('[data-test-slug-input]');

                expect(find('[data-test-slug-input]').value, 'slug value is correctly dasherized').to.equal('white-space');

                await fillIn('[data-test-email-input]', 'thisisnotanemail');
                await blur('[data-test-email-input]');

                expect(find('.user-details-bottom .form-group:nth-of-type(3)').classList.contains('error'), 'email input should be in error state with invalid email').to.be.true;

                await fillIn('[data-test-email-input]', 'test@example.com');
                await fillIn('[data-test-location-input]', new Array(160).join('a'));
                await blur('[data-test-location-input]');

                expect(
                    find('[data-test-location-input]').closest('.form-group'),
                    'location input should be in error state'
                ).to.have.class('error');

                await fillIn('[data-test-location-input]', '');
                await fillIn('[data-test-website-input]', 'thisisntawebsite');
                await blur('[data-test-website-input]');

                expect(
                    find('[data-test-website-input]').closest('.form-group'),
                    'website input should be in error state'
                ).to.have.class('error');

                let testSocialInput = async function (type, input, expectedValue, expectedError = '') {
                    await fillIn(`[data-test-${type}-input]`, input);
                    await blur(`[data-test-${type}-input]`);

                    expect(
                        find(`[data-test-${type}-input]`).value,
                        `${type} value for ${input}`
                    ).to.equal(expectedValue);

                    expect(
                        find(`[data-test-error="user-${type}"]`).textContent.trim(),
                        `${type} validation response for ${input}`
                    ).to.equal(expectedError);

                    expect(
                        find(`[data-test-error="user-${type}"]`).closest('.form-group').classList.contains('error'),
                        `${type} input should be in error state with '${input}'`
                    ).to.equal(!!expectedError);
                };

                let testFacebookValidation = async (...args) => testSocialInput('facebook', ...args);
                let testTwitterValidation = async (...args) => testSocialInput('twitter', ...args);

                // Testing Facebook input

                // displays initial value
                expect(find('[data-test-facebook-input]').value, 'initial facebook value')
                    .to.equal('https://www.facebook.com/test');

                await focus('[data-test-facebook-input]');
                await blur('[data-test-facebook-input]');

                // regression test: we still have a value after the input is
                // focused and then blurred without any changes
                expect(find('[data-test-facebook-input]').value, 'facebook value after blur with no change')
                    .to.equal('https://www.facebook.com/test');

                await testFacebookValidation(
                    'facebook.com/username',
                    'https://www.facebook.com/username');

                await testFacebookValidation(
                    'testuser',
                    'https://www.facebook.com/testuser');

                await testFacebookValidation(
                    'ab99',
                    'https://www.facebook.com/ab99');

                await testFacebookValidation(
                    'page/ab99',
                    'https://www.facebook.com/page/ab99');

                await testFacebookValidation(
                    'page/*(&*(%%))',
                    'https://www.facebook.com/page/*(&*(%%))');

                await testFacebookValidation(
                    'facebook.com/pages/some-facebook-page/857469375913?ref=ts',
                    'https://www.facebook.com/pages/some-facebook-page/857469375913?ref=ts');

                await testFacebookValidation(
                    'https://www.facebook.com/groups/savethecrowninn',
                    'https://www.facebook.com/groups/savethecrowninn');

                await testFacebookValidation(
                    'http://github.com/username',
                    'http://github.com/username',
                    'The URL must be in a format like https://www.facebook.com/yourPage');

                await testFacebookValidation(
                    'http://github.com/pages/username',
                    'http://github.com/pages/username',
                    'The URL must be in a format like https://www.facebook.com/yourPage');

                // Testing Twitter input

                // loads fixtures and performs transform
                expect(find('[data-test-twitter-input]').value, 'initial twitter value')
                    .to.equal('https://twitter.com/test');

                await focus('[data-test-twitter-input]');
                await blur('[data-test-twitter-input]');

                // regression test: we still have a value after the input is
                // focused and then blurred without any changes
                expect(find('[data-test-twitter-input]').value, 'twitter value after blur with no change')
                    .to.equal('https://twitter.com/test');

                await testTwitterValidation(
                    'twitter.com/username',
                    'https://twitter.com/username');

                await testTwitterValidation(
                    'testuser',
                    'https://twitter.com/testuser');

                await testTwitterValidation(
                    'http://github.com/username',
                    'https://twitter.com/username');

                await testTwitterValidation(
                    '*(&*(%%))',
                    '*(&*(%%))',
                    'The URL must be in a format like https://twitter.com/yourUsername');

                await testTwitterValidation(
                    'thisusernamehasmorethan15characters',
                    'thisusernamehasmorethan15characters',
                    'Your Username is not a valid Twitter Username');

                // Testing bio input

                await fillIn('[data-test-website-input]', '');
                await fillIn('[data-test-bio-input]', new Array(210).join('a'));
                await blur('[data-test-bio-input]');

                expect(
                    find('[data-test-bio-input]').closest('.form-group'),
                    'bio input should be in error state'
                ).to.have.class('error');
            });

            it('warns when leaving without saving', async function () {
                await visit('/staff/test-1');

                expect(currentURL(), 'currentURL').to.equal('/staff/test-1');

                await fillIn('[data-test-slug-input]', 'another slug');
                await blur('[data-test-slug-input]');

                expect(find('[data-test-slug-input]').value).to.be.equal('another-slug');

                await fillIn('[data-test-facebook-input]', 'testuser');
                await blur('[data-test-facebook-input]');

                expect(find('[data-test-facebook-input]').value).to.be.equal('https://www.facebook.com/testuser');

                await visit('/settings/staff');

                expect(findAll('[data-test-modal]').length, 'modal exists').to.equal(1);

                // Leave without saving
                await click('.fullscreen-modal [data-test-leave-button]');

                expect(currentURL(), 'currentURL').to.equal('/settings/staff');

                await visit('/staff/test-1');

                expect(currentURL(), 'currentURL').to.equal('/staff/test-1');

                // settings were not saved
                expect(find('[data-test-slug-input]').value).to.be.equal('test-1');
                expect(find('[data-test-facebook-input]').value).to.be.equal('https://www.facebook.com/test');
            });
        });

        it('redirects to 404 when user does not exist', async function () {
            this.server.get('/users/slug/unknown/', function () {
                return new Response(404, {'Content-Type': 'application/json'}, {errors: [{message: 'User not found.', type: 'NotFoundError'}]});
            });

            errorOverride();

            await visit('/staff/unknown');

            errorReset();
            expect(currentRouteName()).to.equal('error404');
            expect(currentURL()).to.equal('/staff/unknown');
        });
    });

    describe('when logged in as author', function () {
        let adminRole, authorRole;

        beforeEach(async function () {
            adminRole = this.server.create('role', {name: 'Administrator'});
            authorRole = this.server.create('role', {name: 'Author'});
            this.server.create('user', {roles: [authorRole]});

            return await authenticateSession();
        });

        it('can access the staff page', async function () {
            this.server.create('user', {roles: [adminRole]});

            errorOverride();

            await visit('/staff');

            errorReset();
            expect(currentRouteName()).to.equal('staff.index');
            expect(findAll('.gh-alert').length).to.equal(0);
        });
    });
});
