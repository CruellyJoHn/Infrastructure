export const SIMPLE_METHOD = {
    get: 'get',
    head: 'head'
};

export const COMPLEX_METHOD = {
    post: 'post',
    patch: 'patch',
    put: 'put'
}

export const METHOD_MAP = {
    simple: Object.values(SIMPLE_METHOD),
    complex: Object.values(COMPLEX_METHOD)
}

export const UNAUTHORIZED_CODE_ARRAY = ['ERR_M001_UNAUTHORIZED', 'NO_ACCESS'];
export const NO_AUTH_HTTP_STATUS = 401;