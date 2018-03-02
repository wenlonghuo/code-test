
enum Status {
  NORMAL = 1,
  DONE = 2,
  DELETED = 3
}

struct PostItem {
  1: string content = '',
  2: string author,
}

exception CodeError {
  1: i32 code = 0,
  2: string message = ''
}

struct ListItem {
  1: i32 id,
  2: string content = '',
  3: Status status = 1,
  4: string author,
  5: i32 textLength
}

service Todo {
  list<ListItem> getTodoList(),
  i32 getTotalLength(1: string author),
  i8 postTodo(1: PostItem item)
  ListItem doneArtical(1: i32 id)
  ListItem deleteArtical(1: i32 id)
}
