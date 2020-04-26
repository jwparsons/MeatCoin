module.exports = {
    sort: function(array, compare) {
        for (let i = 1; i < array.length; i++) {
            let j = i - 1;
            let element = array[i];

            while (j >= 0 && compare(array[j], element)) {
                array[j + 1] = array[j];
                j--;
            }

            array[j+1] = element;
        }

        return array;
    }
};