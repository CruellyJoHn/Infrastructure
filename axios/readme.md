### API数据结构规范化

#### 后台响应规范

##### GET请求成功

```typescript
// 单个资源的数据结构定义：
interface ResItemByGet {
    [key: string]: any
}

// list的数据结构定义：
interface ResListByGet {
    items: ResItemByGet[]  // 必有
    [key: string]: any
}
```

##### POST/DELETE/PATCH等方法 以及 GET方法请求错误下 返回的数据结构

```typescript
interface BackendRes {
	status: 'Success' | 'Failure'
	code: 'Ok' | '其他错误状态码'
	msg: string
}
```

#### 前端响应规范（即对后台返回数据包装后，返回业务的数据结构）

```typescript
interface ResReturn<T> {
    success: boolean;
    msg?: string;
    data: T
}
```



### Axios（封装后）基本用法

```typescript
import axios from '@/util/axios';
interface AxiosConfig extends AxiosRequestConfig {
    // 以下配置是业务自定义配置
    closeAutoCancel: boolean; 
    maskEl: Element;
    errMsg: string;
    okMsg: string;
    isSilent: boolean;
    cancelFn: (cancel: Canceler) => void;
}
// axios[method] (url, data, config: AxiosConfig)
```

#### GET

```typescript
import axios from '@/util/axios';

// 获取单个资源
const getXxx = async (name: string): Promise<ResReturn<ResItemByGet>> => {
    return axios.get('xxx/yyy', {
        name
    });
};

// 获取列表资源
const getXxxList = async (params: T): Promise<ResReturn<ResListByGet>> => {
    return axios.get('xxx/yyy', params);
};
```

#### POST/PUT/PATCH

> 这三个方法使用方式一致，这里只举例POST方法

```typescript
import axios from '@/util/axios';

interface ExampleParams {
    name: string; // 当修改单个资源时，name是必传
    [key: string]: any
}

// 修改/创建 单个资源
const postXxx = async (params: ExampleParams): Promise<ResReturn> => {
    return axios.post('xxx/yyy', {
        name: params.name,
        ...params
    });
};
```

#### DELETE

```typescript
import axios from '@/util/axios';

// 获取单个资源
const getXxx = async (name: string): Promise<ResReturn> => {
    return axios.delete('xxx/yyy', {
        name
    });
};
```

#### 开启/关闭遮罩

```typescript
const getXxx = async (name: string): Promise<ResReturn<ResItemByGet>> => {
    return axios.get('xxx/yyy', {
        name
    },{ maskEl: this.$refs.xxx });  // maskEl不配置则为不开启
};
```

#### 自定义成功/失败信息

```typescript
const getXxx = async (name: string): Promise<ResReturn<ResItemByGet>> => {
    return axios.get('xxx/yyy', {
        name
    },{ errMsg: '网络延迟，请稍后重试', okMsg: '请求成功，请到xx页面查看状态' });  // maskEl不配置则为不开启
};

// 关闭成功/失败信息提示
const getXxx = async (name: string): Promise<ResReturn<ResItemByGet>> => {
    return axios.get('xxx/yyy', {
        name
    },{ isSilent: true });  // maskEl不配置则为不开启
};
```

#### 取消请求
```typescript

// 前提场景： 该请求需要查询1s-5min，所以 交互上提供取消按钮，若查询时间过久，可以取消查询
// 获取数据
async fetchData () {
    this.cancelHandel = null;
    let { success, message, data } = await axios.get('api/tables', {
        id: 12312123
    },{
        errMsg: _('获取表格数据失败'),
        cancelFn: cancel => {
            this.cancelHandel = cancel;
        }
    });
}

// 点击取消按钮后，取消正在查询的请求
...
cancelQuery () {
    this.cancelHandel && this.cancelHandel();
    // 其他业务
}

```

### API

#### AxiosConfig配置

> 这里仅展示业务自定义的配置，axios本身的配置到[官网](http://www.axios-js.com/zh-cn/docs)查看

| 名称            | 描述                                            | 类型    | 默认值     | 备注                              |
| --------------- | ----------------------------------------------- | ------- | ---------- | --------------------------------- |
| closeAutoCancel | 关闭  忽略请求响应内容 功能（当页面发生切换时）   | boolean | false      |                                   |
| cancelFn        | 通过此函数获取axios的cancel方法                | (cancel: Canceler) => void | -  |  业务中自定义取消请求    |
| isSilent        | 是否不展示错误/成功信息提示                     | boolean | false      | 为true时，errMsg/okMsg配置不生效  |
| errMsg          | 当请求失败时，弹出自定义消息                    | string  | `请求失败` | 当后台响应参数msg为空时，才会生效 |
| okMsg           | 用于请求访问成功后，弹出成功提示框；             | string  | `操作成功` |                                   |
| maskEl          | 遮罩开启后根据此参数挂载；                      | Element | -          | 若不配置或不传则默认不开启遮罩    |