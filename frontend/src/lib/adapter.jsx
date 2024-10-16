// creating a Gun adapter for the organized storage
// this adapter needs to communicate with the peers informing everything about the localstorage
// Debashish Buragohain

import Gun from "gun";
import Rad from "gun/lib/radisk";

// db param is the gun instance that is being created
Gun.on('create', function (db) {
    // allow other extensions to register as well
    this.to.next(db);

    // register IO listeners with gun context
    db.on('get', function (request) {
        this.to.next(request);
        // read data here
        const dedupId = request['#'];
        const get = request.get;
        const key = get['#'];       // the key of the node to retrieve
        // . exists means we are requesting a particular property or else the entire node
        const field = get.hasOwnProperty('.') ? get['.'] : null;
    });

    db.on('put', function (request) {
        this.to.next(request);
        // write data here
    });
})