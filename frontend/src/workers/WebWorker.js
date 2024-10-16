// We are dynamically creating and exporting a URL for our webworker
// Debashish Buragohain

export default class WebWorker {
    constructor(worker) {
        const code = worker.toString();
        const blob = new Blob([`(${code})()`]);
        return new Worker(URL.createObjectURL(blob));
    }
}