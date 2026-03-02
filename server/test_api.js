import http from 'http';

http.get('http://localhost:5050/api/campuses', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const list = JSON.parse(data).data;
        if (list.length > 0) {
            http.get(`http://localhost:5050/api/campuses/${list[0].id}`, (res2) => {
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => console.log(data2));
            });
        } else {
            console.log('No campuses found');
        }
    });
});
