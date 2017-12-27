

exports.messageDateSortComparator = (message1, message2) => {
    const message1_time = message1.created_at.getTime();
    const message2_time = message2.created_at.getTime();
    if (message1_time > message2_time) {
        return -1;
    }
    if (message1_time < message2_time) {
        return 1;
    }
    return 0;
}