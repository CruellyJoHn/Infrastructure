import axios, { Canceler } from 'axios';
import token from '@/utils/token';
import type { 
    AxiosConfig,
    AxiosResponse,
    AxiosError,
    ResItemByGet,
    ResListByGet,
    BackendRes,
    ResReturn
} from './interface';

import { SIMPLE_METHOD, METHOD_MAP, NO_AUTH_HTTP_STATUS, UNAUTHORIZED_CODE_ARRAY } from './const';
import { jumpLogin } from '@/api/common/login';

const TOKEN_ID = 'csrf_id';

type BackendData = ResItemByGet | ResListByGet | BackendRes;
// 转换后台数据为前端规范数据结构
const formatBackendToFrontendData = (backendData: BackendData, isGetMethod: boolean): ResReturn<BackendData>  => {
    let { status, msg } = backendData;

    // 如果是get请求, 并且status不存在情况下；则表示get请求成功
    if(isGetMethod && !status){
        return {
            success: true,
            data: backendData
        }
    }

    // 其余请求 以及 get请求失败场景
    return {
        success: status === 'Success',
        msg
    }
}

// 根据api规范或业务需求对url进行加工
const handleUrl = (url: string, name: string): string => {

    // 名称存在，则表示指定资源进行增删；
    let target = name ? `/${encodeURIComponent(name)}` : '';

    return `${url}${target}`;
}

// 开启/关闭遮罩
const handleMask = (target: Component | Element, openMask: boolean) => {
    if (!target) {
        return;
    }

    let $el = target.$el ?? target;
    Vue.prototype[openMask ? '$mask' : '$unmask'].call(null, $el);
}

class Axios {
    requestQueue: AxiosRequestConfig[] = [];
    axios: AxiosInstance;

    private initAxios() {

        // 创建axios实例
        this.axios = axios.create();
        this.setDefaultConfig();
        this.rewriteMethod();
        this.reqInterceptors();
        this.resInterceptors();
    }

    // 全局请求默认配置
    private setDefaultConfig() {
        this.axios.defaults.timeout = 60000;
        this.axios.defaults.headers.common[TOKEN_ID] = token.get();
    }

    // 按照api规范，重写axios
    private rewriteMethod(): void {
        if(!this.axios) return;

        [...METHOD_MAP.simple, ...METHOD_MAP.complex].forEach(method => {
            this.axios[method] = (url: string, data: object, config: AxiosConfig) => {

                // 赋予默认值
                let axiosConfig: AxiosConfig = {
                    closeAutoCancel: false, 
                    maskEl: null,
                    errMsg: _('请求失败'),
                    okMsg: _('操作成功呢'),
                    isSilent: false,
                    ...config
                }

                // 遮罩
                handleMask(config.maskEl, !!config.maskEl);

                // 发送请求
                if(METHOD_MAP.simple.includes(method)){
                    return axios({
                        method,
                        url: handleUrl(url, data?.name),
                        params: { 
                            ...(data ?? {}),
                            t: new Date().getTime() // 添加时间戳，防止get获取到缓存内容
                        },
                        ...config
                    })
                }
                
                return axios({
                    method,
                    url: handleUrl(url, data?.name),
                    data,
                    ...config
                })
            }
        })
    }

    // 请求拦截器
    private reqInterceptors(): void {
        if(!this.axios) return;

        this.axios.interceptors.request.use((config: AxiosConfig) => {

            // 封装取消请求的token
            config.cancelToken = new axios.CancelToken((cancel: Canceler) => {
                
                // 挂载到AxiosConfig上，方便内部调用该方法进行请求取消
                config.$cancel = cancel;

                // 调用回调，抛出cancel方法到业务，方便业务自定义取消请求
                config.cancelFn?.((msg?: string) => {
                    cancel(msg);
                    this.removeReq(config.cancelToken);
                })
            });
            
            // 记录当前请求
            this.requestQueue.push(config);
            return config;
        }, (err: AxiosError) => {
            let { config } = err;
            handleMask(config.maskEl, false);
            window.console.error(`request error: ${err}`);
        });
    }

    // 响应拦截器
    private resInterceptors(): void {
        if(!this.axios) return;

        this.axios.interceptors.response.use((response: AxiosResponse) => {
            
            // 响应成功
            let { config, data } = response;

            // 文件下载
            // this.$http({
            //     url: 'xxxxxxxxxxxxxx',
            //     responseType: 'blob',
            //     file: true
            // })
            if (response?.config?.file === true) {
                return response;
            }

            // 遮罩关闭
            handleMask(config.maskEl, false);
            // 成功提示
            !config.isSilent && Vue.prototype.$ok(config.okMsg);
            this.removeReq(config.cancelToken);

            return Promise.resolve(formatBackendToFrontendData(data, config.method === SIMPLE_METHOD.get));
        }, (err: AxiosError) => { // 响应失败
            let { response, config, message } = err;

            window.console.error(`response error: ${err}`);
            this.removeReq(config.cancelToken);
            
            // 遮罩关闭
            handleMask(config.maskEl, false);

            // 失败提示，优先采用后台返回的错误提示
            !config.isSilent && Vue.prototype.$fail(response?.data?.msg ?? config.errMsg);

            // 返回业务的数据
            // 请求发送成功，服务器有响应，但状态码超出了2xx范围
            if(response){
                // 登录过期；则跳转至登录页
                this.reLogin(response.status, response.data);
                return Promise.reject(formatBackendToFrontendData(response.data, config.method === SIMPLE_METHOD.get));
            }

            // 请求成功发送，但没收到响应 或者 发送请求时出了问题
            return Promise.reject({
                success: false,
                msg: message ?? config.errMsg
            })
        });
    }

    // 登录过期处理
    private reLogin(status, data: BackendData): void {

        // 判断是否未授权
        if(status !== NO_AUTH_HTTP_STATUS && !UNAUTHORIZED_CODE_ARRAY.includes(data?.code)){
            return;
        }

        // 登录页面内的不再弹窗
        if (window.__LOGIN_PAGE__) {
            return;
        }

        Vue.prototype.$confirm({
            icon: 'warning',
            subTitle: _('请重新登录'),
            msg: _('当前会话空闲时间已超过限定时间，为保障系统安全性，请重新登录设备'),
            closeable: false,
            buttons: ['submit'],
            submitLoading: true,
            submit: () => {
                // 哪怕请求失败 也要跳到登录页
                return jumpLogin();
            },
        });
    }

    // 中止并移除请求队列中，等待处理的请求（closeAutoCancel为false）
    private cancelReq() {
        
        this.requestQueue = this.requestQueue.filter(req => {
            if (!req.closeAutoCancel) {
                req.$cancel();
                return false;
            }
            return true;
        });
    }

    // 清理请求队列中，cancelToken一致的请求
    private removeReq(cancelToken) {
        this.requestQueue.filter(reqConfig => reqConfig.cancelToken !== cancelToken);
    }
}

export default new Axios().axios;