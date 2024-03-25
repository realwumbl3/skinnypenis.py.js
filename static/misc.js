
export function imgToDataUrl(url, max_side = 256) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = function (e) {
            const canvas = document.createElement('canvas');
            // Resize the image to max_side x max_side retaining aspect ratio
            const aspect = img.width / img.height;
            const width = aspect > 1 ? max_side : max_side * aspect;
            const height = aspect > 1 ? max_side / aspect : max_side;
            canvas.width = width;
            canvas.height = height;           
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            res(canvas.toDataURL());
        };
        img.onerror = rej;
        img.src = URL.createObjectURL(url);
    })
}

export function insertAtRange(content) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.insertNode(content);
    // set selection to the end of the inserted content
    range.setStartAfter(content);
}