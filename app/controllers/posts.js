import Controller from '@ember/controller';
import {alias} from '@ember/object/computed';
import {computed} from '@ember/object';
import {get} from '@ember/object';
import {inject as service} from '@ember/service';

const TYPES = [{
    name: 'All posts',
    value: null
}, {
    name: 'Draft posts',
    value: 'draft'
}, {
    name: 'Published posts',
    value: 'published'
}, {
    name: 'Scheduled posts',
    value: 'scheduled'
}, {
    name: 'Featured posts',
    value: 'featured'
}];

const ORDERS = [{
    name: 'Newest',
    value: null
}, {
    name: 'Oldest',
    value: 'published_at asc'
}, {
    name: 'Recently updated',
    value: 'updated_at desc'
}];

export default Controller.extend({

    session: service(),
    store: service(),

    queryParams: ['type', 'tag', 'order'],

    type: null,
    tag: null,
    order: null,

    _hasLoadedTags: false,
    _hasLoadedAuthors: false,

    availableTypes: null,
    availableOrders: null,

    init() {
        this._super(...arguments);
        this.availableTypes = TYPES;
        this.availableOrders = ORDERS;
    },

    postsInfinityModel: alias('model'),

    showingAll: computed('type', 'tag', function () {
        let {type, tag} = this.getProperties(['type', 'tag']);

        return !type && !tag;
    }),

    selectedType: computed('type', function () {
        let types = this.get('availableTypes');
        return types.findBy('value', this.get('type'));
    }),

    selectedOrder: computed('order', function () {
        let orders = this.get('availableOrders');
        return orders.findBy('value', this.get('order'));
    }),

    _availableTags: computed(function () {
        return this.get('store').peekAll('tag');
    }),

    availableTags: computed('_availableTags.[]', function () {
        let tags = this.get('_availableTags')
            .filter(tag => tag.get('id') !== null)
            .sort((tagA, tagB) => tagA.name.localeCompare(tagB.name, undefined, {ignorePunctuation: true}));
        let options = tags.toArray();

        options.unshiftObject({name: 'All tags', slug: null});

        return options;
    }),

    selectedTag: computed('tag', '_availableTags.[]', function () {
        let tag = this.get('tag');
        let tags = this.get('availableTags');

        return tags.findBy('slug', tag);
    }),

    currentUserId: computed('session.user.id', function () {
        return this.get('session.user.id');
    }),

    actions: {
        changeType(type) {
            this.set('type', get(type, 'value'));
        },

        changeAuthor(author) {
            this.set('author', get(author, 'slug'));
        },

        changeTag(tag) {
            this.set('tag', get(tag, 'slug'));
        },

        changeOrder(order) {
            this.set('order', get(order, 'value'));
        },

        openEditor(post) {
            this.transitionToRoute('editor.edit', 'post', post.get('id'));
        }
    }
});
