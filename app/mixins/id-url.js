import Mixin from '@ember/object/mixin';
import {isBlank} from '@ember/utils';

export default Mixin.create({
    buildURL(_modelName, _id, _snapshot, _requestType, query) {
        let url = this._super(...arguments);

        if (query && !isBlank(query.id)) {
            url += `${query.id}/`;
            delete query.id;
        }

        return url;
    }
});
