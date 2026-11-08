import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const ink = Color(0xFF26312D);
const sage = Color(0xFF78977A);
const paleSage = Color(0xFFF5F9F4);

void main() => runApp(const DaylightApp());

class DaylightApp extends StatelessWidget {
  const DaylightApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'daylight',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFFF5F6F2),
          colorScheme: ColorScheme.fromSeed(seedColor: sage, surface: Colors.white),
          fontFamily: 'Roboto',
        ),
        home: const TodoHome(),
      );
}

class TodoItem {
  TodoItem({required this.id, required this.title, this.time, this.done = false});
  final String id;
  final String title;
  final String? time;
  bool done;

  Map<String, Object?> toJson() => {'id': id, 'title': title, 'time': time, 'done': done};
  factory TodoItem.fromJson(Map<String, dynamic> json) => TodoItem(
        id: json['id'] as String,
        title: json['title'] as String,
        time: json['time'] as String?,
        done: json['done'] as bool? ?? false,
      );
}

enum TodoFilter { all, todo, completed }

class TodoHome extends StatefulWidget {
  const TodoHome({super.key});
  @override
  State<TodoHome> createState() => _TodoHomeState();
}

class _TodoHomeState extends State<TodoHome> {
  List<TodoItem> todos = [];
  TodoFilter filter = TodoFilter.all;
  bool loaded = false;

  @override
  void initState() {
    super.initState();
    _loadTodos();
  }

  Future<void> _loadTodos() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('daylight-todos');
    setState(() {
      if (saved != null) {
        todos = (jsonDecode(saved) as List<dynamic>)
            .map((item) => TodoItem.fromJson(item as Map<String, dynamic>))
            .toList();
      } else {
        todos = [
          TodoItem(id: '1', title: 'Plan the week ahead', time: '09:00 AM', done: true),
          TodoItem(id: '2', title: 'Finish the project proposal', time: '10:30 AM'),
          TodoItem(id: '3', title: 'Pick up groceries', time: '01:00 PM'),
          TodoItem(id: '4', title: 'Go for an evening walk', time: '06:00 PM'),
        ];
      }
      loaded = true;
    });
    if (saved == null) _saveTodos();
  }

  Future<void> _saveTodos() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('daylight-todos', jsonEncode(todos.map((todo) => todo.toJson()).toList()));
  }

  Future<void> _addTodo(String title, String? time) async {
    setState(() => todos.insert(0, TodoItem(id: DateTime.now().microsecondsSinceEpoch.toString(), title: title, time: time)));
    await _saveTodos();
  }

  Future<void> _toggle(TodoItem todo) async {
    setState(() => todo.done = !todo.done);
    await _saveTodos();
  }

  Future<void> _delete(TodoItem todo) async {
    setState(() => todos.removeWhere((item) => item.id == todo.id));
    await _saveTodos();
  }

  @override
  Widget build(BuildContext context) {
    final doneCount = todos.where((item) => item.done).length;
    final remaining = todos.length - doneCount;
    final filtered = todos.where((item) {
      if (filter == TodoFilter.todo) return !item.done;
      if (filter == TodoFilter.completed) return item.done;
      return true;
    }).toList();
    final progress = todos.isEmpty ? 0.0 : doneCount / todos.length;
    final now = DateTime.now();
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    final dateLabel = '${weekdays[now.weekday - 1]}, ${months[now.month - 1]} ${now.day}';

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 620),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              padding: const EdgeInsets.symmetric(horizontal: 34),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(25), border: Border.all(color: const Color(0xFFE8EBE7)), boxShadow: const [BoxShadow(color: Color(0x0A314738), blurRadius: 34, offset: Offset(0, 12))]),
              child: !loaded ? const Center(child: CircularProgressIndicator(color: sage)) : Column(
                children: [
                  _topBar(),
                  Expanded(
                    child: ListView(
                      padding: EdgeInsets.zero,
                      children: [
                        const SizedBox(height: 37),
                        Row(children: [const Icon(Icons.calendar_today_rounded, size: 14, color: Color(0xFF829087)), const SizedBox(width: 7), Text(dateLabel, style: const TextStyle(color: Color(0xFF829087), fontSize: 12, fontWeight: FontWeight.w600))]),
                        const SizedBox(height: 17),
                        const Text.rich(TextSpan(style: TextStyle(fontSize: 33, height: 1.18, fontWeight: FontWeight.w800, letterSpacing: -1.3, color: ink), children: [TextSpan(text: 'A little progress\n'), TextSpan(text: 'goes a long way.', style: TextStyle(color: sage))])),
                        const SizedBox(height: 10),
                        const Text('Keep your day simple. One thing at a time.', style: TextStyle(fontSize: 13, color: Color(0xFF879089))),
                        const SizedBox(height: 25),
                        _progress(doneCount, todos.length, progress),
                        const SizedBox(height: 32),
                        Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('My tasks', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700, letterSpacing: -.4, color: Color(0xFF303B35))), const SizedBox(height: 4), Text(remaining == 0 ? 'You’re all caught up' : '$remaining ${remaining == 1 ? 'thing' : 'things'} left for today', style: const TextStyle(fontSize: 12, color: Color(0xFF909990)))])),
                          FilledButton.icon(onPressed: _showAddTask, icon: const Icon(Icons.add, size: 18), label: const Text('New task'), style: FilledButton.styleFrom(backgroundColor: sage, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11), textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)))),
                        ]),
                        const SizedBox(height: 24),
                        _filters(remaining),
                        if (filtered.isEmpty) _emptyState() else ...filtered.map((todo) => _taskRow(todo)),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                  Container(height: 49, alignment: Alignment.center, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFFEFF1EE)))), child: const Text('✳  Make room for what matters.', style: TextStyle(fontSize: 11, color: Color(0xFFA2AAA2)))),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _topBar() => Container(
        height: 65,
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFEFF1EE)))),
        child: Row(children: [Container(width: 30, height: 30, decoration: BoxDecoration(color: const Color(0xFFEAF3E9), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.wb_sunny_outlined, size: 18, color: Color(0xFF648B6B))), const SizedBox(width: 9), const Text('daylight', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, letterSpacing: -.5, color: ink)), const Spacer(), const Icon(Icons.check_circle_outline_rounded, size: 17, color: Color(0xFF90A090)), const SizedBox(width: 7), const Text('A fresh start', style: TextStyle(fontSize: 11, color: Color(0xFF829087)))]),
      );

  Widget _progress(int done, int total, double progress) => Container(
        padding: const EdgeInsets.fromLTRB(18, 15, 18, 16),
        decoration: BoxDecoration(color: paleSage, border: Border.all(color: const Color(0xFFEDF2EB)), borderRadius: BorderRadius.circular(13)),
        child: Column(children: [Row(children: [const Expanded(child: Text('YOUR DAILY PROGRESS', style: TextStyle(fontSize: 9, letterSpacing: 1, fontWeight: FontWeight.w700, color: Color(0xFF869187)))), Text('$done', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF435449))), Text(' / $total done', style: const TextStyle(fontSize: 11, color: Color(0xFF929B93))), const SizedBox(width: 12), Text('${(progress * 100).round()}%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: sage))]), const SizedBox(height: 12), ClipRRect(borderRadius: BorderRadius.circular(10), child: LinearProgressIndicator(value: progress, minHeight: 5, backgroundColor: const Color(0xFFE5EBE3), color: const Color(0xFF86A88A))) ]),
      );

  Widget _filters(int remaining) => Column(children: [Row(children: [
        _filterTab('All tasks', TodoFilter.all), const SizedBox(width: 22), _filterTab('To do', TodoFilter.todo, count: remaining), const SizedBox(width: 22), _filterTab('Completed', TodoFilter.completed),
      ]), const Divider(height: 1, color: Color(0xFFEDF0ED))]);

  Widget _filterTab(String label, TodoFilter value, {int? count}) {
    final selected = filter == value;
    return InkWell(onTap: () => setState(() => filter = value), child: Padding(padding: const EdgeInsets.only(bottom: 11, top: 2), child: Row(mainAxisSize: MainAxisSize.min, children: [Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? const Color(0xFF55775B) : const Color(0xFF9BA39C))), if (count != null) ...[const SizedBox(width: 6), Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: const Color(0xFFEEF4ED), borderRadius: BorderRadius.circular(20)), child: Text('$count', style: const TextStyle(fontSize: 10, color: Color(0xFF708875))))]])));
  }

  Widget _taskRow(TodoItem todo) => Container(
        constraints: const BoxConstraints(minHeight: 65),
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF0F2EF)))),
        child: Row(children: [
          InkWell(onTap: () => _toggle(todo), borderRadius: BorderRadius.circular(8), child: AnimatedContainer(duration: const Duration(milliseconds: 160), width: 21, height: 21, decoration: BoxDecoration(color: todo.done ? const Color(0xFF82A285) : Colors.white, border: Border.all(color: todo.done ? const Color(0xFF82A285) : const Color(0xFFD8DFD8), width: 1.5), borderRadius: BorderRadius.circular(7)), child: todo.done ? const Icon(Icons.check, size: 15, color: Colors.white) : null)),
          const SizedBox(width: 14), Expanded(child: Padding(padding: const EdgeInsets.symmetric(vertical: 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [Text(todo.title, style: TextStyle(fontSize: 13, height: 1.4, fontWeight: FontWeight.w500, color: todo.done ? const Color(0xFFA6AEA7) : const Color(0xFF3E4942), decoration: todo.done ? TextDecoration.lineThrough : null)), if (todo.time != null) ...[const SizedBox(height: 4), Text(todo.time!, style: const TextStyle(fontSize: 10, color: Color(0xFF9AA39B)))]]))),
          IconButton(onPressed: () => _delete(todo), icon: const Icon(Icons.delete_outline_rounded, size: 18), color: const Color(0xFFADB6AD), tooltip: 'Delete task'),
        ]),
      );

  Widget _emptyState() => SizedBox(height: 250, child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Container(width: 44, height: 44, decoration: BoxDecoration(color: const Color(0xFFF2F6F0), borderRadius: BorderRadius.circular(15)), child: const Icon(Icons.wb_sunny_outlined, size: 21, color: sage)), const SizedBox(height: 12), Text(filter == TodoFilter.completed ? 'Nothing completed just yet' : 'A clear little slate', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF556259))), const SizedBox(height: 6), Text(filter == TodoFilter.completed ? 'Finished tasks will show up here.' : 'Add a task and make today yours.', style: const TextStyle(fontSize: 12, color: Color(0xFF939D94))), if (filter != TodoFilter.completed) TextButton.icon(onPressed: _showAddTask, icon: const Icon(Icons.add, size: 15), label: const Text('Add your first task'), style: TextButton.styleFrom(foregroundColor: const Color(0xFF648B6B)))]));

  Future<void> _showAddTask() async {
    final titleController = TextEditingController();
    TimeOfDay? selectedTime;
    await showModalBottomSheet<void>(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, builder: (context) => StatefulBuilder(builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
          child: Container(padding: const EdgeInsets.fromLTRB(24, 24, 24, 28), decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(23))), child: SafeArea(top: false, child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [const Expanded(child: Text('Add a task', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700, color: ink))), IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Color(0xFF738077)))]),
            const SizedBox(height: 14), const Text('What would you like to do?', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF56635A))), const SizedBox(height: 8),
            TextField(controller: titleController, autofocus: true, maxLength: 100, decoration: InputDecoration(hintText: 'e.g. Call mum', counterText: '', filled: true, fillColor: const Color(0xFFFCFDFB), border: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: const BorderSide(color: Color(0xFFE5EAE4))), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: const BorderSide(color: Color(0xFFE5EAE4))), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13))),
            const SizedBox(height: 14), OutlinedButton.icon(onPressed: () async { final picked = await showTimePicker(context: context, initialTime: TimeOfDay.now()); if (picked != null) setSheetState(() => selectedTime = picked); }, icon: const Icon(Icons.schedule_rounded, size: 18), label: Text(selectedTime == null ? 'Add a time (optional)' : selectedTime!.format(context)), style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFF68766B), side: const BorderSide(color: Color(0xFFE5EAE4)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)))),
            const SizedBox(height: 18), SizedBox(width: double.infinity, height: 46, child: FilledButton.icon(onPressed: () { final title = titleController.text.trim(); if (title.isEmpty) return; final time = selectedTime?.format(context); Navigator.pop(context); _addTodo(title, time); }, icon: const Icon(Icons.add, size: 18), label: const Text('Add to my day'), style: FilledButton.styleFrom(backgroundColor: sage, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)))))
          ]))),
        )));
  }
}
