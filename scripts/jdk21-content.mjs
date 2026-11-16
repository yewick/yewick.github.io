export const features = [
  {
    slug: "virtualthread",
    jep: "444",
    title: "虚拟线程",
    en: "Virtual Threads",
    category: "并发编程",
    status: "FINAL",
    order: 1,
    tagline: "让一任务一线程重新变得可扩展。",
    summary: "虚拟线程由 JDK 调度，按需挂载到少量平台线程上。它保留顺序、阻塞式的 Java 编程模型，同时提高大量等待型任务的并发承载能力。",
    goals: ["理解虚拟线程与载体线程的关系", "掌握每任务一线程的执行器写法", "识别固定载体、池化与 ThreadLocal 误用"],
    concepts: [
      { label: "M:N", title: "轻量调度", body: "大量虚拟线程映射到少量载体线程，等待时通常可以卸载。" },
      { label: "I/O", title: "等待型负载", body: "更适合网络、数据库等经常阻塞的任务，而不是 CPU 密集计算。" },
      { label: "TASK", title: "一任务一线程", body: "虚拟线程便宜且无需池化，一个任务对应一条虚拟线程。" }
    ],
    changes: [
      "Thread API 新增 ofVirtual()、startVirtualThread() 等创建入口。",
      "Executors 提供 newVirtualThreadPerTaskExecutor()，并兼容 ExecutorService。",
      "JDK 21 中，synchronized 内的阻塞操作仍可能固定载体线程。"
    ],
    exampleTitle: "每任务新建一条虚拟线程",
    lang: "java",
    filename: "VirtualThreadDemo.java",
    code: String.raw`import java.time.Duration;
import java.util.concurrent.Executors;

public class VirtualThreadDemo {
    public static void main(String[] args) throws Exception {
        try (var executor =
                 Executors.newVirtualThreadPerTaskExecutor()) {
            executor.submit(() -> {
                Thread.sleep(Duration.ofMillis(200));
                System.out.println(Thread.currentThread());
                return null;
            });
        }
    }
}`,
    notes: [
      { type: "note", title: "执行器关闭会等待", text: "try-with-resources 结束时会关闭执行器，并等待已提交任务完成。" },
      { type: "warning", title: "不要池化", text: "需要限制下游并发时使用 Semaphore 等工具，而不是复用虚拟线程。" }
    ],
    pitfalls: [
      { title: "把虚拟线程当成“更快线程”", body: "CPU 并行度仍受核心数限制；虚拟线程的价值主要是吞吐量与编程模型。" },
      { title: "在 ThreadLocal 里缓存昂贵连接", body: "一任务一线程会让这种缓存模式产生大量重复资源。" }
    ],
    takeaways: ["用线程表达任务，用信号量表达限流。", "阻塞式代码也可以拥有更高扩展性。", "迁移后要用真实负载和 JFR 验证。"]
  },
  {
    slug: "string-templates",
    jep: "430",
    title: "字符串模板",
    en: "String Templates",
    category: "语言表达",
    status: "PREVIEW",
    order: 2,
    tagline: "把插值、格式化和安全处理交给模板处理器。",
    summary: "字符串模板把固定文本与嵌入式表达式组合在一起，再由模板处理器决定最终格式。它比简单拼接更强调可检查性和上下文安全。",
    goals: ["理解模板处理器与模板表达式的分工", "使用 STR 构造普通字符串", "知道预览 API 不承诺跨版本稳定性"],
    concepts: [
      { label: "TEMPLATE", title: "模板表达式", body: "固定文本与反斜杠包裹的表达式共同组成模板。" },
      { label: "PROCESSOR", title: "处理器", body: "STR、FMT 或自定义处理器决定模板如何验证与组合。" },
      { label: "PREVIEW", title: "预览特性", body: "JDK 21 中需要开启 preview 才能编译和运行。" }
    ],
    changes: [
      "嵌入式表达式使用反斜杠加花括号，而不是传统字符串拼接。",
      "模板先形成可处理的结构，再交给模板处理器转换。",
      "标准处理器包括 STR 与 FMT，也允许实现自定义处理器。"
    ],
    exampleTitle: "构造一条可读的欢迎信息",
    lang: "java",
    filename: "TemplateDemo.java",
    code: String.raw`record User(String name, int age) {}

public class TemplateDemo {
    public static void main(String[] args) {
        User user = new User("Duke", 21);

        String message = STR."""
            欢迎 \{user.name()}，
            今年 \{user.age()} 岁。
            """;

        System.out.println(message);
    }
}`,
    notes: [
      { type: "note", title: "编译命令", text: "使用 JDK 21 预览能力：javac --enable-preview --release 21 TemplateDemo.java。" },
      { type: "warning", title: "不等于字符串拼接", text: "模板处理器可以在生成结果之前检查表达式、格式和上下文，这为 SQL、HTML 等场景提供了安全扩展点。" }
    ],
    pitfalls: [
      { title: "省略处理器", body: "模板必须有处理器，例如 STR.\"...\"；它不是无上下文的语言级字符串插值。" },
      { title: "把预览语法写进长期 API", body: "预览特性可能调整甚至被撤回，库设计需要谨慎。" }
    ],
    takeaways: ["模板 = 文本 + 表达式 + 处理器。", "先组合模板，再决定如何生成结果。", "JDK 21 中必须明确预览边界。"]
  },
  {
    slug: "sequenced-collections",
    jep: "431",
    title: "顺序集合",
    en: "Sequenced Collections",
    category: "集合框架",
    status: "FINAL",
    order: 3,
    tagline: "让“有首尾顺序”的集合拥有统一契约。",
    summary: "JDK 21 引入 SequencedCollection、SequencedSet 和 SequencedMap，用统一接口描述具有确定遇到顺序的集合，并提供首尾访问与反向视图。",
    goals: ["识别集合是否具有确定顺序", "掌握首尾访问与反向视图 API", "理解它统一了原本分散的集合能力"],
    concepts: [
      { label: "LIST", title: "顺序集合", body: "List、Deque 等集合获得统一的 getFirst、getLast 与 reversed。" },
      { label: "SET", title: "顺序集", body: "LinkedHashSet 等具有顺序的 Set 可以表达首尾元素。" },
      { label: "MAP", title: "顺序映射", body: "LinkedHashMap 等映射可访问首个和最后一个键值对。" }
    ],
    changes: [
      "新增 SequencedCollection、SequencedSet、SequencedMap 接口。",
      "集合支持 addFirst、addLast、getFirst、getLast 与 removeFirst 等统一操作。",
      "reversed() 返回反向顺序视图，而不是复制整个集合。"
    ],
    exampleTitle: "用统一 API 处理首尾和反向视图",
    lang: "java",
    filename: "SequencedDemo.java",
    code: String.raw`import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

public class SequencedDemo {
    public static void main(String[] args) {
        List<String> logs = new ArrayList<>(
            List.of("boot", "ready", "serve")
        );

        logs.addFirst("start");
        logs.addLast("stop");

        System.out.println(logs.getFirst());
        System.out.println(logs.getLast());
        System.out.println(logs.reversed());

        var versions = new LinkedHashMap<String, Integer>();
        versions.put("17", 17);
        versions.put("21", 21);
        System.out.println(versions.firstEntry());
        System.out.println(versions.lastEntry());
    }
}`,
    notes: [
      { type: "note", title: "反向视图不是副本", text: "对 reversed() 结果的修改会反映到原集合；遍历和访问规则要依据接口契约。" },
      { type: "warning", title: "不是所有集合都有顺序", text: "HashSet 等无序集合不具有确定遇到顺序，因此不自动获得顺序集合语义。" }
    ],
    pitfalls: [
      { title: "把顺序误当排序", body: "顺序集合表达的是确定的遇到顺序，不代表元素按自然顺序排序。" },
      { title: "替换具体实现", body: "接口统一了能力，但如果业务依赖 LinkedHashMap 的插入顺序，仍应保留明确的实现选择。" }
    ],
    takeaways: ["首尾访问终于有了统一接口。", "reversed() 提供视图而非复制。", "顺序与排序是两个不同概念。"]
  },
  {
    slug: "generational-zgc",
    jep: "439",
    title: "分代 ZGC",
    en: "Generational ZGC",
    category: "垃圾回收",
    status: "FINAL",
    order: 4,
    tagline: "在低暂停目标下，利用分代假设提高分配友好度。",
    summary: "JDK 21 的分代 ZGC 将堆区分为年轻代与老年代，分别执行回收。它延续并发、低暂停的设计，同时更适配大多数对象很快死亡的分配模式。",
    goals: ["理解年轻代与老年代的回收差异", "掌握 JDK 21 的启用参数", "用暂停、吞吐和 CPU 成本评估收益"],
    concepts: [
      { label: "YOUNG", title: "年轻代", body: "频繁回收生命周期短的对象，降低整体复制与扫描成本。" },
      { label: "OLD", title: "老年代", body: "承载长期存活对象，回收频率通常更低。" },
      { label: "PAUSE", title: "低暂停", body: "分代并不放弃 ZGC 的低延迟目标，仍需按真实负载观察。" }
    ],
    changes: [
      "ZGC 支持年轻代与老年代两套回收策略。",
      "JDK 21 中通过 -XX:+ZGenerational 启用分代模式。",
      "默认并启用 ZGC 时，JDK 21 仍要求显式开启分代选项。"
    ],
    exampleTitle: "用分代 ZGC 启动应用",
    lang: "bash",
    filename: "start.sh",
    code: String.raw`java \
  -XX:+UseZGC \
  -XX:+ZGenerational \
  -Xmx8g \
  -Xlog:gc*:file=gc.log \
  -jar app.jar`,
    notes: [
      { type: "note", title: "以日志为准", text: "重点观察 Pause、young generation、old generation、堆占用与 GC 线程 CPU 成本。" },
      { type: "warning", title: "不是通用性能开关", text: "GC 选择应由对象生命周期、堆规模、延迟目标与机器资源共同决定。" }
    ],
    pitfalls: [
      { title: "只看平均暂停", body: "尾延迟、CPU 占用和分配速率同样关键，平均值可能掩盖长尾。" },
      { title: "未设置明确堆预算", body: "分代回收仍需要足够堆空间；参数组合应在真实压测中验证。" }
    ],
    takeaways: ["分代利用“大多数对象很快死亡”的经验。", "JDK 21 用 ZGenerational 显式启用。", "GC 优化必须由日志和压测驱动。"]
  },
  {
    slug: "record-patterns",
    jep: "440",
    title: "记录模式",
    en: "Record Patterns",
    category: "模式匹配",
    status: "FINAL",
    order: 5,
    tagline: "一次匹配，直接拆开记录中的组件。",
    summary: "记录模式让 instanceof 与 switch 可以直接解构 record。模式可以嵌套，从而用接近数据形状的语法同时完成类型检查与变量绑定。",
    goals: ["用记录模式替代连续的类型转换", "理解嵌套模式的解构过程", "掌握模式变量的作用域"],
    concepts: [
      { label: "TYPE", title: "先匹配类型", body: "记录模式首先要求值与记录类型兼容。" },
      { label: "COMPONENT", title: "再解构组件", body: "每个组件位置都能继续使用类型模式或嵌套记录模式。" },
      { label: "SCOPE", title: "流程敏感作用域", body: "模式变量只在匹配成功的控制流范围内可用。" }
    ],
    changes: [
      "instanceof 可以直接匹配 Record 并提取组件。",
      "记录模式支持任意层级嵌套。",
      "可以与 switch 模式匹配组合使用。"
    ],
    exampleTitle: "拆解一条二维线段",
    lang: "java",
    filename: "RecordPatternDemo.java",
    code: String.raw`record Point(int x, int y) {}
record Line(Point start, Point end) {}

public class RecordPatternDemo {
    public static void main(String[] args) {
        Object value = new Line(new Point(1, 2), new Point(8, 9));

        if (value instanceof Line(
                Point(var x1, var y1),
                Point(var x2, var y2))) {
            System.out.printf(
                "从 (%d,%d) 到 (%d,%d)%n",
                x1, y1, x2, y2
            );
        }
    }
}`,
    notes: [
      { type: "note", title: "类型检查与解构同时发生", text: "代码不再需要先强转外层记录，再逐个调用访问器。" },
      { type: "warning", title: "模式变量不是全局变量", text: "变量只在模式匹配成功的分支和作用域中可见。" }
    ],
    pitfalls: [
      { title: "为了模式而滥用 record", body: "record 适合透明数据载体；具有复杂可变生命周期和身份语义的领域对象仍应按模型设计。" },
      { title: "过深的嵌套", body: "嵌套模式很直观，但过多层解构会降低可读性，必要时拆出辅助方法。" }
    ],
    takeaways: ["记录模式让数据形状直接出现在控制流中。", "解构可以嵌套，并保留精确类型。", "模式变量遵守流程敏感作用域。"]
  },
  {
    slug: "pattern-matching-switch",
    jep: "441",
    title: "switch 模式匹配",
    en: "Pattern Matching for switch",
    category: "模式匹配",
    status: "FINAL",
    order: 6,
    tagline: "让 switch 按类型、组件和条件表达规则。",
    summary: "switch 现在可以使用类型模式、记录模式和守卫条件 when。对于 sealed 类型，编译器还能检查分支是否穷尽。",
    goals: ["用模式分支替代重复的类型判断", "使用 when 添加匹配条件", "理解 sealed 类型与穷尽性检查"],
    concepts: [
      { label: "TYPE", title: "类型模式", body: "每个 case 可绑定具体的运行时类型及其变量。" },
      { label: "WHEN", title: "守卫条件", body: "类型匹配后再检查附加布尔条件，失败则继续尝试后续分支。" },
      { label: "SEALED", title: "穷尽性", body: "封闭类型层级让编译器能确认所有可能子类型都被覆盖。" }
    ],
    changes: [
      "case 支持带变量的类型模式。",
      "case 可与记录模式组合，直接解构数据。",
      "when 守卫允许更精确的分支选择，sealed 层级支持穷尽性检查。"
    ],
    exampleTitle: "按 sealed 形状计算面积",
    lang: "java",
    filename: "SwitchPatternDemo.java",
    code: String.raw`sealed interface Shape
    permits Circle, Rectangle {}

record Circle(double radius) implements Shape {}
record Rectangle(double width, double height)
    implements Shape {}

public class SwitchPatternDemo {
    static double area(Shape shape) {
        return switch (shape) {
            case Circle(var r) ->
                Math.PI * r * r;
            case Rectangle(var w, var h) when w > 0 && h > 0 ->
                w * h;
            case Rectangle ignored ->
                throw new IllegalArgumentException("尺寸必须为正");
        };
    }

    public static void main(String[] args) {
        System.out.println(area(new Circle(2)));
    }
}`,
    notes: [
      { type: "note", title: "穷尽性是编译期能力", text: "sealed 类型没有 default 也可以完成穷尽性检查，新增子类型时编译器会提示需要处理的分支。" },
      { type: "warning", title: "模式顺序有语义", text: "更具体的类型和带 when 的分支通常应放在更宽泛的分支之前。" }
    ],
    pitfalls: [
      { title: "遗漏 domineering 模式", body: "过宽的模式会让后续分支不可达，编译器会拒绝这类 switch。" },
      { title: "把 null 当普通模式值", body: "null 的匹配规则需要单独理解；必要时使用 case null 明确处理。" }
    ],
    takeaways: ["switch 从值分支升级为规则分支。", "when 让类型匹配再叠加业务条件。", "sealed 与模式匹配共同提供穷尽性检查。"]
  },
  {
    slug: "foreign-function-memory",
    jep: "442",
    title: "外部函数与内存 API",
    en: "Foreign Function & Memory API",
    category: "原生互操作",
    status: "PREVIEW",
    order: 7,
    tagline: "用标准 Java API 安全访问堆外内存与本地函数。",
    summary: "FFM API 统一管理 Java 堆外内存段、函数描述符和函数句柄，减少直接依赖 JNI 的样板代码，同时保留边界检查与生命周期控制。",
    goals: ["理解 Arena 对内存生命周期的约束", "读写基础 MemorySegment", "知道预览 API 的版本限制"],
    concepts: [
      { label: "ARENA", title: "生命周期", body: "Arena 管理一段原生内存的生命周期，关闭后其分配内存不可继续访问。" },
      { label: "LAYOUT", title: "布局描述", body: "ValueLayout 描述内存中的字节宽度、对齐与字节序。" },
      { label: "HANDLE", title: "本地函数", body: "通过 Linker 与函数描述符获得可调用的外部函数句柄。" }
    ],
    changes: [
      "java.lang.foreign 提供统一的堆外内存、链接器与函数句柄 API。",
      "受限 Arena 默认由创建它的线程管理，并支持确定性的 try-with-resources 释放。",
      "FFM API 在 JDK 21 仍是预览能力。"
    ],
    exampleTitle: "在一个受限 Arena 中读写 int",
    lang: "java",
    filename: "MemoryDemo.java",
    code: String.raw`import java.lang.foreign.Arena;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;

public class MemoryDemo {
    public static void main(String[] args) {
        try (Arena arena = Arena.ofConfined()) {
            MemorySegment number =
                arena.allocate(ValueLayout.JAVA_INT);

            number.set(ValueLayout.JAVA_INT, 0, 42);
            int value =
                number.get(ValueLayout.JAVA_INT, 0);

            System.out.println(value);
        }
    }
}`,
    notes: [
      { type: "note", title: "先管理生命周期", text: "理解 Arena 的 confined、shared、automatic 等策略，比记住函数调用顺序更重要。" },
      { type: "warning", title: "仍必须验证原生边界", text: "内存段带有大小和生命周期约束，但调用不安全的本地库仍需自行验证协议与参数。" }
    ],
    pitfalls: [
      { title: "绕过内存段直接传递裸地址", body: "这会丢失边界与生命周期保护，只在确有必要的底层适配中使用。" },
      { title: "Arena 关闭后继续访问", body: "关闭 Arena 会使相关段失效，应在作用域内完成所有访问。" }
    ],
    takeaways: ["Arena 把内存生命周期显式化。", "Layout 让读写宽度和字节序可见。", "JDK 21 中 FFM 仍处于预览阶段。"]
  },
  {
    slug: "unnamed-patterns",
    jep: "443",
    title: "未命名模式与变量",
    en: "Unnamed Patterns and Variables",
    category: "语言表达",
    status: "PREVIEW",
    order: 8,
    tagline: "用一个下划线表达“不关心这个值”。",
    summary: "未命名模式与未命名变量用下划线代替不会被使用的名字，让模式解构和局部变量声明更直接，同时避免无意义的命名与未使用警告。",
    goals: ["在记录模式中使用未命名模式", "在局部变量与 catch 参数中使用下划线", "区分未命名和普通变量的作用域"],
    concepts: [
      { label: "_", title: "未命名模式", body: "模式位置上的下划线表示不绑定该位置的值。" },
      { label: "LOCAL", title: "未命名变量", body: "局部变量或异常参数可以省略名字，明确表达不会读取这个值。" },
      { label: "SCOPE", title: "不可访问", body: "未命名变量没有可用的标识符，不能像普通变量一样引用。" }
    ],
    changes: [
      "记录模式中的组件可以使用未命名模式。",
      "局部变量声明、for-each 与 catch 参数可使用未命名变量。",
      "编译器不再因为“变量定义了但未使用”而需要无意义命名。"
    ],
    exampleTitle: "只关心坐标 x，忽略 y",
    lang: "java",
    filename: "UnnamedPatternDemo.java",
    code: String.raw`record Point(int x, int y) {}
record Box<T>(T value) {}

public class UnnamedPatternDemo {
    public static void main(String[] args) {
        Object value = new Point(12, 8);

        if (value instanceof Point(var x, _)) {
            System.out.println("x = " + x);
        }

        Object box = new Box<>("payload");
        if (box instanceof Box(_)) {
            System.out.println("只关心是否是非 null Box");
        }

        try {
            Integer.parseInt("not-a-number");
        } catch (NumberFormatException _) {
            System.out.println("格式错误");
        }
    }
}`,
    notes: [
      { type: "note", title: "意图更明确", text: "下划线不是约等于“丢弃赋值”，而是语言层面声明“此处不需要名字”。" },
      { type: "warning", title: "预览边界", text: "JDK 21 编译该语法需要启用 preview。" }
    ],
    pitfalls: [
      { title: "把 _ 当成普通变量", body: "未命名变量不能被读取，也不能通过多个下划线规避命名。" },
      { title: "过度使用", body: "省略名字应当强化意图；如果值确实需要理解，保留描述性变量名更好。" }
    ],
    takeaways: ["下划线表达不绑定的意图。", "模式解构不一定要为每个位置命名。", "JDK 21 中仍属于预览语言特性。"]
  },
  {
    slug: "unnamed-classes-main-methods",
    jep: "445",
    title: "未命名类与实例 main 方法",
    en: "Unnamed Classes and Instance Main Methods",
    category: "语言入门",
    status: "PREVIEW",
    order: 9,
    tagline: "让小型 Java 程序少一些仪式代码。",
    summary: "JDK 21 预览一个更轻量的单文件程序模型：源文件可以不显式声明类，并允许实例 main 方法作为程序入口。",
    goals: ["编写一个最小单文件程序", "理解未命名类与普通类的边界", "知道预览入口规则的变化风险"],
    concepts: [
      { label: "FILE", title: "单文件", body: "源文件顶层可以直接声明方法和导入，由编译器创建隐式未命名类。" },
      { label: "MAIN", title: "实例入口", body: "启动器可识别非 static 的 main 方法，并创建实例后调用。" },
      { label: "SIMPLE", title: "学习友好", body: "目标是降低教学、脚本和原型代码的启动负担。" }
    ],
    changes: [
      "源文件可以直接包含一个 main 方法，无需显式写 class。",
      "程序启动器支持实例 main 方法作为入口。",
      "未命名类不能被其他类按正式名称引用。"
    ],
    exampleTitle: "一个无需 class 声明的 Java 单文件",
    lang: "java",
    filename: "Hello.java",
    code: String.raw`void main() {
    String name = "JDK 21";
    System.out.println("Hello, " + name + "!");
}`,
    notes: [
      { type: "note", title: "运行方式", text: "使用 java --enable-preview --source 21 Hello.java 直接运行单文件。" },
      { type: "warning", title: "适合小程序", text: "共享 API、模块化和大型工程仍需要具名类与清晰的包结构。" }
    ],
    pitfalls: [
      { title: "把未命名类当成可复用类型", body: "它没有供其他源文件引用的类名，更适合脚本或教学入口。" },
      { title: "忽略单文件限制", body: "一个源文件只能有一个未命名类，复杂程序仍应使用显式结构。" }
    ],
    takeaways: ["小程序的样板代码减少了。", "实例 main 方法可以成为入口。", "大型工程仍应保持显式类型设计。"]
  },
  {
    slug: "scoped-values",
    jep: "446",
    title: "作用域值",
    en: "Scoped Values",
    category: "并发上下文",
    status: "PREVIEW",
    order: 10,
    tagline: "把不可变上下文显式限制在调用作用域内。",
    summary: "ScopedValue 提供在有限动态作用域内共享不可变值的能力。它与虚拟线程和结构化并发配合时，能表达比可变 ThreadLocal 更清晰的上下文生命周期。",
    goals: ["理解 ScopedValue 的绑定作用域", "在 where(...).run(...) 中传递上下文", "识别它与 ThreadLocal 的差异"],
    concepts: [
      { label: "BIND", title: "绑定值", body: "ScopedValue.where 在代码块执行期间为键绑定值。" },
      { label: "READ", title: "读取值", body: "作用域内通过 get() 读取；作用域外读取会抛出异常。" },
      { label: "IMMUTABLE", title: "不可变", body: "作用域内不能修改已绑定值，降低隐式状态泄漏。" }
    ],
    changes: [
      "新增 ScopedValue API，用于动态作用域上下文。",
      "绑定具有明确开始与结束，不依赖线程复用。",
      "在 JDK 21 中仍为预览特性。"
    ],
    exampleTitle: "将当前用户绑定到一个调用作用域",
    lang: "java",
    filename: "ScopedValueDemo.java",
    code: String.raw`public class ScopedValueDemo {
    private static final ScopedValue<String> USER =
        ScopedValue.newInstance();

    public static void main(String[] args) {
        ScopedValue.where(USER, "duke")
            .run(() -> handleRequest());
    }

    static void handleRequest() {
        System.out.println("当前用户: " + USER.get());
    }
}`,
    notes: [
      { type: "note", title: "生命周期更明确", text: "上下文从绑定开始，到 run 或 call 结束；外部代码不能继续读取。" },
      { type: "warning", title: "不是所有 ThreadLocal 的一比一替代", text: "可变缓存、线程长期共享对象等场景仍需重新设计。" }
    ],
    pitfalls: [
      { title: "把作用域值当缓存", body: "ScopedValue 表达调用上下文，不应承担昂贵资源的线程级缓存。" },
      { title: "跨作用域保存值快照", body: "作用域内可以读取但不能修改；需要传递的数据应作为参数或新绑定继续传递。" }
    ],
    takeaways: ["上下文应拥有明确生命周期。", "不可变绑定降低隐式状态污染。", "与虚拟线程模型配合更自然。"]
  },
  {
    slug: "vector-api",
    jep: "448",
    title: "Vector API",
    en: "Vector API",
    category: "数据并行",
    status: "INCUBATOR",
    order: 11,
    tagline: "用可移植的向量表达式描述数据并行。",
    summary: "Vector API 让 Java 代码用 Vector 类型描述批量元素运算，运行时再映射到可用硬件指令。它是性能实验 API，而不是普通集合替代品。",
    goals: ["理解 species、lane 与向量运算", "写出只处理整块的向量循环", "为尾部元素保留标量路径"],
    concepts: [
      { label: "SPECIES", title: "向量形状", body: "VectorSpecies 描述元素类型、lane 数量与形状。" },
      { label: "LANE", title: "并行元素", body: "一次运算同时处理多个 lane，最终由运行时映射到硬件。" },
      { label: "TAIL", title: "尾部处理", body: "数组长度不一定整除向量宽度，剩余元素仍需标量代码。" }
    ],
    changes: [
      "jdk.incubator.vector 提供元素类型专用的向量 API。",
      "可组合向量运算、掩码和数组加载/存储。",
      "JDK 21 中是第六轮孵化 API。"
    ],
    exampleTitle: "一次计算四个 float 的和",
    lang: "java",
    filename: "VectorDemo.java",
    code: String.raw`import jdk.incubator.vector.FloatVector;
import jdk.incubator.vector.VectorSpecies;

public class VectorDemo {
    static final VectorSpecies<Float> SPECIES =
        FloatVector.SPECIES_128;

    public static void main(String[] args) {
        float[] left = {1, 2, 3, 4};
        float[] right = {10, 20, 30, 40};
        float[] result = new float[4];

        FloatVector a = FloatVector.fromArray(SPECIES, left, 0);
        FloatVector b = FloatVector.fromArray(SPECIES, right, 0);
        a.add(b).intoArray(result, 0);

        System.out.println(java.util.Arrays.toString(result));
    }
}`,
    notes: [
      { type: "note", title: "编译与运行", text: "需要 --enable-preview --release 21，并通过 --add-modules jdk.incubator.vector 引入孵化模块。" },
      { type: "warning", title: "不要先优化再测量", text: "向量 API 是否产生硬件优势取决于元素类型、数据规模和 JVM 映射；应以基准测试为准。" }
    ],
    pitfalls: [
      { title: "忘记尾部", body: "实际数组长度往往不是 species length 的整数倍，必须处理剩余元素。" },
      { title: "把孵化和稳定 API 混用", body: "孵化模块的 API 和包路径可能随版本调整，应隔离在性能关键层。" }
    ],
    takeaways: ["向量 API 描述数据并行，而非线程并行。", "向量形状与尾部处理是核心细节。", "所有收益都必须用基准测试确认。"]
  },
  {
    slug: "disallow-win32-port",
    jep: "449",
    title: "弃用 Windows 32 位 x86 端口",
    en: "Deprecate the Windows 32-bit x86 Port",
    category: "平台迁移",
    status: "DEPRECATE",
    order: 12,
    tagline: "为移除维护成本高、使用率低的旧平台移植版做准备。",
    summary: "JDK 21 将 Windows 32 位 x86 端口标记为 deprecated for removal。这个 JEP 不改变主流 64 位 Windows、Linux 或 macOS 平台的 Java 运行方式。",
    goals: ["区分 32 位 x86 与主流 64 位平台", "检查构建和部署环境的架构", "为旧平台迁移制定计划"],
    concepts: [
      { label: "PORT", title: "平台端口", body: "JDK 的端口与特定 CPU 架构、操作系统 ABI 相关。" },
      { label: "DEPRECATE", title: "弃用为移除", body: "该标记不会立即删除能力，但意味着后续版本可能不再提供。" },
      { label: "MIGRATE", title: "迁移排查", body: "检查 CI、桌面客户端、本地库和安装包是否依赖 32 位 JDK。" }
    ],
    changes: [
      "Windows 32 位 x86 端口被标记为 deprecated for removal。",
      "主流 64 位 Windows x64 与 Arm64 不在本次弃用范围内。",
      "旧平台用户应尽快验证 64 位运行时和依赖链。"
    ],
    exampleTitle: "先确认正在使用的 Java 架构",
    lang: "bash",
    filename: "architecture-check.sh",
    code: String.raw`java -XshowSettings:properties -version 2>&1 \
  | grep -E "java.version|os.arch|os.name"

# 常见输出
# java.version = 21.x
# os.arch = amd64
# os.name = Windows 11`,
    notes: [
      { type: "note", title: "不是语言特性", text: "这是平台维护项，学习重点不在 API，而在构建、发布和依赖扫描。" },
      { type: "warning", title: "本地库可能决定架构", body: "即使 Java 代码可移植，JNI 或本地依赖也可能只提供 32 位版本。" }
    ],
    pitfalls: [
      { title: "把 x86 和 x64 视为同一平台", body: "32 位与 64 位进程模型、可用地址空间和本地库 ABI 不同。" },
      { title: "只检查开发机", body: "还需要检查 CI runner、打包环境和最终用户的运行环境。" }
    ],
    takeaways: ["弃用为移除不等于立刻失效。", "平台迁移首先是依赖链梳理。", "主流 x64 与 Arm64 用户通常不受此项影响。"]
  },
  {
    slug: "dynamic-agent-loading",
    jep: "451",
    title: "动态加载 Java Agent",
    en: "Prepare to Disallow Dynamic Loading of Agents",
    category: "平台治理",
    status: "PREPARE",
    order: 13,
    tagline: "让运行时动态挂载 Agent 从默认行为变成显式选择。",
    summary: "JDK 21 开始，当 Java Agent 在运行时被动态加载，JVM 会发出警告。这个准备性变化为未来默认禁止动态挂载、提升启动完整性做准备。",
    goals: ["理解启动加载与动态加载的区别", "识别警告来源", "区分监控工具和无意集成"],
    concepts: [
      { label: "STARTUP", title: "启动时加载", body: "通过 -javaagent 在 JVM 启动阶段加载，行为更可预测。" },
      { label: "DYNAMIC", title: "动态挂载", body: "程序启动后通过 Attach API 等机制挂载 Agent。" },
      { label: "WARNING", title: "显式选择", body: "JDK 21 用警告提示未来治理方向，并允许临时显式放行。" }
    ],
    changes: [
      "运行时动态加载 Agent 时 JVM 输出 warning。",
      "可临时使用 -XX:+EnableDynamicAgentLoading 显式允许。",
      "启动时通过 -javaagent 配置的 Agent 不触发该动态加载警告。"
    ],
    exampleTitle: "识别并显式选择",
    lang: "bash",
    filename: "agent-policy.sh",
    code: String.raw`# JDK 21 可能输出：
# WARNING: A Java agent has been loaded dynamically

# 仅为兼容既有工具时显式放行
java -XX:+EnableDynamicAgentLoading \
     -jar application.jar`,
    notes: [
      { type: "note", title: "先确认是谁在挂载", text: "警告可能来自 APM、调试、热部署或测试工具；先定位来源再讨论策略。" },
      { type: "warning", title: "显式放行不是长期默认方案", text: "该开关用于迁移期兼容，不应无脑加入所有生产启动脚本。" }
    ],
    pitfalls: [
      { title: "误以为 Agent 已不可用", body: "JDK 21 主要是警告和准备性变化，并未立即默认禁止。" },
      { title: "忽略供应链风险", body: "动态 Agent 能修改字节码和运行时行为，需要受控来源和审计。" }
    ],
    takeaways: ["动态 Agent 加载正在变成需要显式声明的行为。", "启动加载比运行时挂载更容易审计。", "迁移期开关应只为可识别工具保留。"]
  },
  {
    slug: "key-encapsulation",
    jep: "452",
    title: "密钥封装机制 API",
    en: "Key Encapsulation Mechanism API",
    category: "安全 API",
    status: "FINAL",
    order: 14,
    tagline: "为标准 KEM 建立统一的封装、解封装接口。",
    summary: "KEM 用接收方公钥派生共享对称密钥，并生成可传输的封装密文。JDK 21 的 javax.crypto.KEM 为 RSA-KEM、DHKEM、未来后量子 KEM 等提供标准 API 形态。",
    goals: ["理解 KEM 的封装与解封装流程", "认识密钥对生成仍沿用现有 API", "区分 KEM 与普通对称加密"],
    concepts: [
      { label: "ENCAPS", title: "封装", body: "发送方用接收方公钥生成共享密钥与封装密文。" },
      { label: "DECAPS", title: "解封装", body: "接收方用私钥处理封装密文，得到同一共享密钥。" },
      { label: "PROVIDER", title: "算法提供者", body: "KEM.getInstance 选择实现；支持和配置由 Security Provider 决定。" }
    ],
    changes: [
      "新增 javax.crypto.KEM、Encapsulator、Decapsulator 等类型。",
      "共享密钥以 SecretKey 返回，允许实现返回不可提取的密钥。",
      "密钥对生成继续使用 KeyPairGenerator，而不是新增一套密钥生成 API。"
    ],
    exampleTitle: "读取 KEM 能力并创建封装器",
    lang: "java",
    filename: "KemDemo.java",
    code: String.raw`import java.security.KeyPairGenerator;
import java.security.PublicKey;
import javax.crypto.KEM;

public class KemDemo {
    public static void main(String[] args) throws Exception {
        var generator = KeyPairGenerator.getInstance("EC");
        var keyPair = generator.generateKeyPair();
        PublicKey receiverPublicKey = keyPair.getPublic();

        KEM kem = KEM.getInstance("DHKEM");
        KEM.Encapsulator encapsulator =
            kem.newEncapsulator(receiverPublicKey);

        KEM.Encapsulated result = encapsulator.encapsulate();
        System.out.println(result.key().getAlgorithm());
        System.out.println(result.encapsulation().length);
    }
}`,
    notes: [
      { type: "note", title: "算法支持由 Provider 决定", text: "实际主题应通过 Security.getProviders() 或 getInstance 的异常结果确认当前运行时就绪情况。" },
      { type: "warning", title: "不要自行拼接协议", text: "共享密钥、封装密文、参数和高层握手消息都有明确格式，应遵循 KEM、HPKE 或 TLS 等协议规范。" }
    ],
    pitfalls: [
      { title: "把封装密文当普通对称密文", body: "KEM 密文用于恢复共享密钥，不应直接当作业务数据加密结果。" },
      { title: "混淆密钥对用途", body: "公钥与私钥职责不同；发送方只需要接收方公钥，接收方私钥不应传输。" }
    ],
    takeaways: ["KEM 用非对称公钥派生对称共享密钥。", "密钥对生成沿用既有 KeyPairGenerator。", "安全实现必须遵循协议，不应自创格式。"]
  },
  {
    slug: "structured-concurrency",
    jep: "453",
    title: "结构化并发",
    en: "Structured Concurrency",
    category: "并发编程",
    status: "PREVIEW",
    order: 15,
    tagline: "让一组并发子任务拥有共同的开始、结束与错误边界。",
    summary: "结构化并发把同一业务操作拆出的多个并发子任务组织到 StructuredTaskScope 中。父作用域统一等待、取消和传播错误，使线程关系与调用结构保持一致。",
    goals: ["用 StructuredTaskScope 管理子任务", "理解 ShutdownOnFailure 的失败传播", "区分结构化并发与虚拟线程"],
    concepts: [
      { label: "SCOPE", title: "共同作用域", body: "所有 fork 出的子任务都属于同一个词法作用域。" },
      { label: "JOIN", title: "统一汇合", body: "join 等待子任务结束，或按策略在失败时关闭剩余任务。" },
      { label: "VIRTUAL", title: "默认运行于虚拟线程", body: "结构化并发提供任务组织模型，虚拟线程提供执行载体。" }
    ],
    changes: [
      "StructuredTaskScope 作为预览 API 出现在 JDK 21。",
      "ShutdownOnFailure 在任一子任务失败时可取消其他任务。",
      "作用域关闭时不会留下未受管理的并发任务。"
    ],
    exampleTitle: "并发查询用户与订单后组合结果",
    lang: "java",
    filename: "StructuredDemo.java",
    code: String.raw`import java.util.concurrent.StructuredTaskScope;

public class StructuredDemo {
    record Profile(String user, String orders) {}

    static Profile loadProfile(long id) throws Exception {
        try (var scope =
                 new StructuredTaskScope.ShutdownOnFailure()) {
            var user = scope.fork(() -> findUser(id));
            var orders = scope.fork(() -> findOrders(id));

            scope.join().throwIfFailed();
            return new Profile(user.get(), orders.get());
        }
    }

    static String findUser(long id) {
        return "user-" + id;
    }

    static String findOrders(long id) {
        return "orders-" + id;
    }

    public static void main(String[] args) throws Exception {
        System.out.println(loadProfile(21));
    }
}`,
    notes: [
      { type: "note", title: "组织关系比执行方式更重要", text: "结构化并发主要解决子任务生命周期与错误传播；虚拟线程解决大量任务的执行成本。" },
      { type: "warning", title: "仍然是预览 API", text: "JDK 21 中 API 可能变化，需要 --enable-preview 才能编译运行。" }
    ],
    pitfalls: [
      { title: "把 fork 当线程池", body: "作用域表示一次业务操作的子任务边界，不应被长期持有或跨请求复用。" },
      { title: "失败后继续读取结果", body: "ShutdownOnFailure 会取消其他任务；应先 join 并检查失败，再读取成功结果。" }
    ],
    takeaways: ["子任务不应逃逸出父操作作用域。", "失败和取消应沿结构化边界传播。", "结构化并发与虚拟线程是互补能力。"]
  }
];
