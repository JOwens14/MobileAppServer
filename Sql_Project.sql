SELECT * FROM Members left join push_token on members.memberid = push_token.memberid WHERE members.memberid in (select memberid_a from contacts where memberid_b = 72 and verified = 1 union select memberid_b from contacts where memberid_a = 72 and verified = 1);



insert into contacts values(72,125,0) on conflict(memberid_a,memberid_b) Do update set verified = ((select verified from contacts where memberid_a = 72 and memberid_b = 125) + 1);