/* eslint-disable camelcase */
import Model from 'ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';
import attr from 'ember-data/attr';

export default Model.extend(ValidationEngine, {
    validationType: 'setting',

    rcServices: service('rc-services'),

    title: attr('string'),
    description: attr('string'),
    logo: attr('string'),
    coverImage: attr('string'),
    icon: attr('string'),
    defaultLocale: attr('string'),
    activeTimezone: attr('string', {defaultValue: 'Etc/UTC'}),
    codeinjectionHead: attr('string'),
    codeinjectionFoot: attr('string'),
    facebook: attr('facebook-url-user'),
    twitter: attr('twitter-url-user'),
    roomId: attr('string'),
    labs: attr('string'),
    navigation: attr('navigation-settings'),
    serverUrl: attr('string'),
    isAnnounced: attr('boolean'),
    isPrivate: attr('boolean'),
    isAuthorsRooms: attr('boolean'),
    announceToken: attr('string'),
    settingsToken: attr('string'),
    isComments: attr('boolean'),
    inviteOnly: attr('boolean'),
    canCollaborate: attr('boolean'),
    publicHash: attr('string'),
    password: attr('string'),
    slack: attr('slack-settings'),
    amp: attr('boolean'),
    unsplash: attr('unsplash-settings', {
        defaultValue() {
            return {isActive: true};
        }
    }),
    membersSubscriptionSettings: attr('string'),

    roomName: computed('roomId', function() {
        this.rcServices.getRoom({rid: this.roomId}).then((room) => {
            const {data: [{exist, roomname}]} = room;
            if (!exist) {
                this.set('roomName', 'NOT EXIST');
            }
            this.set('roomName', roomname);
        });
    })
});
