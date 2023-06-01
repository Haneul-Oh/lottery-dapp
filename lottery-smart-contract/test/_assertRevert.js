module.exports = async (promise) => { // test 실행 결과 Error 처리 하기 위한 module
    try {
        await promise;
        assert.fail('[GOOD] Expected revert does not received.'); // Error 반환되지 않는 경우 
    } catch (error) {
        const revertFound = error.message.search("revert") >= 0; // Error 반환된 경우, 'revert' 단어가 포함되어 있어야 함 
        assert(revertFound, `Expected revert got ${error} instead`); // 포함되어 있지 않으면 Error 반환 
    }
}