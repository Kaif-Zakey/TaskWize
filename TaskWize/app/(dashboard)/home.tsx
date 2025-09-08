import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { onSnapshot } from "firebase/firestore";
import { tasksRef } from "@/service/taskService";
import { Task } from "@/app/types/task";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import WeeklyProgress from "@/components/WeeklyProgress";

const Home = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const allTasks = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Task)
          .filter((task) => task.userId === authUser?.uid); // Filter by current user
        setTasks(allTasks);
      },
      (err) => {
        console.log("Error listening:", err);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "high" && task.status === "pending"
  ).length;
  const tasksWithLocation = tasks.filter((task) => task.location).length;

  // Weekly progress calculation
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    return new Date(now.setDate(diff));
  };

  const weekStart = getWeekStart();
  const thisWeekTasks = tasks.filter((task) => {
    const taskDate = new Date(task.createdAt || "");
    return taskDate >= weekStart;
  });
  const completedThisWeek = thisWeekTasks.filter(
    (task) => task.status === "completed"
  ).length;
  const totalThisWeek = thisWeekTasks.length;

  // Get tasks by category
  const tasksByCategory = tasks.reduce(
    (acc, task) => {
      const category = task.category || "Other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Get recent pending tasks (last 5)
  const recentPendingTasks = tasks
    .filter((task) => task.status === "pending")
    .sort(
      (a, b) =>
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
    )
    .slice(0, 3);

  // Get today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow && task.status === "pending";
  });

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: colors.primary, 
        paddingHorizontal: 24, 
        paddingVertical: 32, 
        borderBottomLeftRadius: 24, 
        borderBottomRightRadius: 24 
      }}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <View>
            <Text style={{ color: 'white', fontSize: 18 }}>Welcome back,</Text>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
              {user?.email?.split("@")[0] || "User"} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              padding: 12, 
              borderRadius: 50 
            }}
            onPress={() => router.push("/(dashboard)/profile")}
          >
            <MaterialIcons name="person" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.2)', 
          padding: 16, 
          borderRadius: 16 
        }}>
          <Text style={{ color: 'white', fontSize: 16, marginBottom: 8 }}>
            Task Completion Rate
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold' }}>
              {completionRate}%
            </Text>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <View style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.3)', 
                height: 8, 
                borderRadius: 4 
              }}>
                <View
                  style={{ 
                    backgroundColor: 'white', 
                    height: 8, 
                    borderRadius: 4,
                    width: `${completionRate}%` 
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Weekly Progress */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <WeeklyProgress
          completedThisWeek={completedThisWeek}
          totalThisWeek={totalThisWeek}
        />
      </View>

      {/* Quick Stats */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: 'bold', 
          color: colors.text, 
          marginBottom: 16 
        }}>
          Quick Overview
        </Text>

        <View style={{ 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          justifyContent: 'space-between' 
        }}>
          <View style={{ 
            backgroundColor: colors.surface, 
            padding: 16, 
            borderRadius: 12, 
            width: '48%', 
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialIcons name="task-alt" size={24} color={colors.info} />
              <Text style={{ 
                marginLeft: 8, 
                color: colors.textSecondary, 
                fontWeight: '500' 
              }}>
                Total Tasks
              </Text>
            </View>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: colors.text 
            }}>
              {totalTasks}
            </Text>
          </View>

          <View style={{ 
            backgroundColor: colors.surface, 
            padding: 16, 
            borderRadius: 12, 
            width: '48%', 
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialIcons name="pending" size={24} color={colors.warning} />
              <Text style={{ 
                marginLeft: 8, 
                color: colors.textSecondary, 
                fontWeight: '500' 
              }}>Pending</Text>
            </View>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: colors.warning 
            }}>
              {pendingTasks}
            </Text>
          </View>

          <View style={{ 
            backgroundColor: colors.surface, 
            padding: 16, 
            borderRadius: 12, 
            width: '48%', 
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <Text style={{ 
                marginLeft: 8, 
                color: colors.textSecondary, 
                fontWeight: '500' 
              }}>Completed</Text>
            </View>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: colors.success 
            }}>
              {completedTasks}
            </Text>
          </View>

          <View style={{ 
            backgroundColor: colors.surface, 
            padding: 16, 
            borderRadius: 12, 
            width: '48%', 
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialIcons name="priority-high" size={24} color={colors.error} />
              <Text style={{ 
                marginLeft: 8, 
                color: colors.textSecondary, 
                fontWeight: '500' 
              }}>
                High Priority
              </Text>
            </View>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: colors.error 
            }}>
              {highPriorityTasks}
            </Text>
          </View>
        </View>
      </View>

      {/* Categories Breakdown */}
      {Object.keys(tasksByCategory).length > 0 && (
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: 'bold', 
            color: colors.text, 
            marginBottom: 16 
          }}>
            Tasks by Category
          </Text>
          <View style={{ 
            backgroundColor: colors.surface, 
            padding: 16, 
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
          }}>
            {Object.entries(tasksByCategory).map(([category, count]) => (
              <View
                key={category}
                className="flex-row justify-between items-center py-2"
              >
                <View className="flex-row items-center">
                  <View className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
                  <Text className="text-gray-700 capitalize">{category}</Text>
                </View>
                <Text className="text-gray-900 font-semibold">{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <View className="px-6 py-4">
          <View className="flex-row items-center mb-4">
            <MaterialIcons name="today" size={24} color="#EF4444" />
            <Text className="text-xl font-bold text-gray-800 ml-2">
              Due Today
            </Text>
            <View className="bg-red-100 px-2 py-1 rounded-full ml-2">
              <Text className="text-red-800 text-xs font-semibold">
                {todayTasks.length}
              </Text>
            </View>
          </View>

          {todayTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              className="bg-red-50 border border-red-200 p-4 rounded-xl mb-3"
              onPress={() => router.push(`/(dashboard)/tasks/${task.id}`)}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text
                    className="text-red-800 font-semibold text-base"
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text
                      className="text-red-600 text-sm mt-1"
                      numberOfLines={1}
                    >
                      {task.description}
                    </Text>
                  )}
                </View>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={16}
                  color="#DC2626"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Pending Tasks */}
      {recentPendingTasks.length > 0 && (
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Recent Pending Tasks
            </Text>
            <TouchableOpacity onPress={() => router.push("/(dashboard)/tasks")}>
              <Text className="text-blue-500 font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          {recentPendingTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              className="bg-white p-4 rounded-xl shadow-sm mb-3"
              onPress={() => router.push(`/(dashboard)/tasks/${task.id}`)}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text
                    className="text-gray-800 font-semibold text-base"
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text
                      className="text-gray-600 text-sm mt-1"
                      numberOfLines={2}
                    >
                      {task.description}
                    </Text>
                  )}
                  <View className="flex-row items-center mt-2">
                    {task.category && (
                      <View className="bg-blue-100 px-2 py-1 rounded-full mr-2">
                        <Text className="text-blue-800 text-xs capitalize">
                          {task.category}
                        </Text>
                      </View>
                    )}
                    {task.priority && (
                      <View
                        className={`px-2 py-1 rounded-full ${
                          task.priority === "high"
                            ? "bg-red-100"
                            : task.priority === "medium"
                              ? "bg-yellow-100"
                              : "bg-green-100"
                        }`}
                      >
                        <Text
                          className={`text-xs capitalize ${
                            task.priority === "high"
                              ? "text-red-800"
                              : task.priority === "medium"
                                ? "text-yellow-800"
                                : "text-green-800"
                          }`}
                        >
                          {task.priority}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={16}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: 'bold', 
          color: colors.text, 
          marginBottom: 16 
        }}>
          Quick Actions
        </Text>

        <View style={{ 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          justifyContent: 'space-between' 
        }}>
          <TouchableOpacity
            style={{ 
              backgroundColor: colors.primary, 
              padding: 16, 
              borderRadius: 12, 
              width: '48%', 
              marginBottom: 12 
            }}
            onPress={() => router.push("/(dashboard)/tasks/new")}
          >
            <MaterialIcons name="add-task" size={28} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginTop: 8 }}>
              Add New Task
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ 
              backgroundColor: colors.success, 
              padding: 16, 
              borderRadius: 12, 
              width: '48%', 
              marginBottom: 12 
            }}
            onPress={() => router.push("/(dashboard)/tasks")}
          >
            <MaterialIcons name="list" size={28} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginTop: 8 }}>
              View All Tasks
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Productivity Tip */}
      <View className="px-6 py-4">
        <View className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-xl">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="lightbulb" size={24} color="white" />
            <Text className="text-white font-semibold text-lg ml-2">
              💡 Productivity Tip
            </Text>
          </View>
          <Text className="text-white text-sm leading-5">
            {completionRate >= 80
              ? "You&apos;re doing amazing! Consider setting more challenging goals to keep growing."
              : completionRate >= 60
                ? "Great progress! Try breaking larger tasks into smaller, manageable steps."
                : completionRate >= 40
                  ? "Keep going! Set specific times for task completion to build momentum."
                  : "Start small! Focus on completing just one task at a time to build confidence."}
          </Text>
        </View>
      </View>

      {/* Location-based Tasks Info */}
      {tasksWithLocation > 0 && (
        <View className="px-6 py-4">
          <View className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="location-on" size={24} color="#8B5CF6" />
              <Text className="ml-2 text-purple-800 font-semibold">
                Location-Based Tasks
              </Text>
            </View>
            <Text className="text-purple-700">
              You have {tasksWithLocation} task
              {tasksWithLocation !== 1 ? "s" : ""} with location reminders set
              up.
            </Text>
          </View>
        </View>
      )}

      {/* Empty State */}
      {totalTasks === 0 && (
        <View className="px-6 py-8">
          <View className="bg-white p-8 rounded-xl shadow-sm items-center">
            <MaterialIcons name="task-alt" size={64} color="#D1D5DB" />
            <Text className="text-xl font-semibold text-gray-600 mt-4 mb-2">
              No tasks yet!
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Start organizing your life by creating your first task.
            </Text>
            <TouchableOpacity
              className="bg-blue-500 px-6 py-3 rounded-lg"
              onPress={() => router.push("/(dashboard)/tasks/new")}
            >
              <Text className="text-white font-semibold">
                Create Your First Task
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className="h-20" />
    </ScrollView>
  );
};

export default Home;
