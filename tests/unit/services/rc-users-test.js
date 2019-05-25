import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';

describe('Unit | Service | rc-users', function() {
  setupTest();

  // Replace this with your real tests.
  it('exists', function() {
    let service = this.owner.lookup('service:rc-users');
    expect(service).to.be.ok;
  });
});
