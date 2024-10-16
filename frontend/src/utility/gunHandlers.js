// utility functions for converting the gun callbacks into a promise
// Debashish Buragohain

const onceHandler = (node) => new Promise((resolve, reject) => {
    node.once((data, key) => {
        // console.log("node once return data:", data);
        // console.log("node once return key:", key);
        node.off();     // remove the once hander after receiving in once
        resolve(data);
    });
});

const putHandler = (node, data) => new Promise((resolve, reject) => {
    node.put(data, (ack) => {
        // console.log("put given node: ", node);
        // console.log("put return data: ", data);
        if (ack.err) reject(ack.err);
        else {
            node.off();
            resolve(ack.ok);
        }
    })
});

export { onceHandler, putHandler };