


module.exports =
  routes: [
     {route: '/test', params: {required: {id: (val) -> return val == 1}}, method: 'POST', call: (req, res, next) -> next()}
  ]


