export type Paging = {
  size: number;
  current_page: number;
  total_page: number;
};

export type Pageable<T> = {
  data: Array<T>;
  paging: Paging;
};
