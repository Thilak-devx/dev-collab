import{c as n,p as s}from"./index-B91PbD5z.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]],d=n("ellipsis",o);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z",key:"1ykcvy"}],["path",{d:"m15 5 3 3",key:"1w25hb"}]],p=n("pencil-line",r);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["path",{d:"M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z",key:"117uat"}],["path",{d:"M6 12h16",key:"s4cdu5"}]],y=n("send-horizontal",i),h=async a=>{const{data:e}=await s.get(`/messages/project/${a}`);return e},g=async a=>{const{data:e}=await s.get(`/projects/${a}/channels`);return e},k=async(a,e)=>{const t={name:e.name,projectId:a},{data:c}=await s.post(`/projects/${a}/channels`,t);return c},u=async a=>{const{data:e}=await s.post("/messages",a);return e},m=async(a,e,t={})=>{const{data:c}=await s.get(`/messages/${e}`,{params:t});return c};export{d as E,p as P,y as S,m as a,u as b,k as c,h as d,g};
